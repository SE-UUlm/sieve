"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { SettingsSection } from "@/components/composites/views/settings/settings-section";
import { StyledButton } from "@/components/ui/styled-button";
import { StyledInput } from "@/components/ui/styled-input";
import { StyledLabel } from "@/components/ui/styled-label";
import {
    StyledSelect,
    StyledSelectContent,
    StyledSelectItem,
    StyledSelectTrigger,
    StyledSelectValue,
} from "@/components/ui/styled-select";
import {
    useImapControllerGetStatus,
    useImapControllerGetConfig,
    useImapControllerTestConnection,
    useImapControllerSaveConfig,
    useImapControllerGetMailboxCount,
    useImapControllerProcessExistingEmails,
} from "@/lib/client/imap/imap";
import { getJobControllerGetHistoryQueryKey } from "@/lib/client/jobs/jobs";
import { useQueryClient } from "@tanstack/react-query";
import { showPersistentErrorToast, showSuccessToast } from "@/lib/toast";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Mail } from "lucide-react";

const formSchema = z.object({
    imapHost: z
        .string()
        .min(1, "IMAP server is required.")
        .max(255, "IMAP server must be at most 255 characters."),
    imapPort: z
        .string()
        .min(1, "Port is required.")
        .refine(
            (v) => { const n = parseInt(v, 10); return !isNaN(n) && n >= 1 && n <= 65535; },
            "Port must be a number between 1 and 65535.",
        ),
    username: z
        .string()
        .min(1, "Username is required.")
        .max(255, "Username must be at most 255 characters."),
    password: z.string().min(1, "Password is required."),
    security: z.enum(["ssl", "starttls", "none"]),
    mailbox: z
        .string()
        .min(1, "Mailbox is required.")
        .max(255, "Mailbox must be at most 255 characters."),
});

type FormValues = z.infer<typeof formSchema>;

export function MailSection() {
    const [testStatus, setTestStatus] = useState<{
        isConnected: boolean;
        messageCount?: number;
        lastError?: string;
    } | null>(null);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [mailboxCount, setMailboxCount] = useState(0);
    const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);

    const { data: statusData, isLoading: isLoadingStatus } = useImapControllerGetStatus();
    const { data: configData, isLoading: isLoadingConfig } = useImapControllerGetConfig();
    const testConnection = useImapControllerTestConnection();
    const saveConfig = useImapControllerSaveConfig();
    const getMailboxCount = useImapControllerGetMailboxCount();
    const processExistingEmails = useImapControllerProcessExistingEmails();
    const queryClient = useQueryClient();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            imapHost: "",
            imapPort: "993",
            username: "",
            password: "",
            security: "ssl",
            mailbox: "INBOX",
        },
    });

    // Load saved config on mount
    useEffect(() => {
        if (configData?.data && configData.data) {
            const config = configData.data;
            form.reset({
                imapHost: config.host || "",
                imapPort: String(config.port || 993),
                username: config.username || "",
                password: "", // Password is not returned for security
                security: config.security || "ssl",
                mailbox: config.mailbox || "INBOX",
            });
        }
    }, [configData, form]);

    // Load status
    useEffect(() => {
        if (statusData?.data) {
            const status = statusData.data;
            setTestStatus({
                isConnected: status.isConnected,
                messageCount: status.messageCount,
                lastError: status.lastError,
            });
        }
    }, [statusData]);

    const handleTestConnection = async (values: FormValues) => {
        setTestStatus(null);
        
        try {
            const result = await testConnection.mutateAsync({
                data: {
                    host: values.imapHost,
                    port: parseInt(values.imapPort, 10),
                    username: values.username,
                    password: values.password,
                    security: values.security,
                    mailbox: values.mailbox,
                },
            });

            if (result.data) {
                setTestStatus({
                    isConnected: result.data.isConnected,
                    messageCount: result.data.messageCount,
                    lastError: result.data.lastError,
                });

                if (result.data.isConnected) {
                    showSuccessToast({
                        title: "Connection successful",
                        description: `Found ${result.data.messageCount} messages in ${values.mailbox}.`,
                    });
                } else {
                    showPersistentErrorToast({
                        title: "Connection failed",
                        description: result.data.lastError || "Could not connect to IMAP server.",
                    });
                }
            }
        } catch (error) {
            showPersistentErrorToast({
                title: "Connection test failed",
                description: error instanceof Error ? error.message : "An unknown error occurred.",
            });
        }
    };

    const handleSaveConfig = async (values: FormValues) => {
        try {
            // First test the connection
            const testResult = await testConnection.mutateAsync({
                data: {
                    host: values.imapHost,
                    port: parseInt(values.imapPort, 10),
                    username: values.username,
                    password: values.password,
                    security: values.security,
                    mailbox: values.mailbox,
                },
            });

            if (!testResult.data?.isConnected) {
                showPersistentErrorToast({
                    title: "Cannot save settings",
                    description: "Please fix the connection issues before saving.",
                });
                return;
            }

            // Check if this is first time setup (no existing config)
            const isFirstTime = !configData?.data?.host;
            setIsFirstTimeSetup(isFirstTime);

            if (isFirstTime) {
                // Get mailbox count for import dialog
                const countResult = await getMailboxCount.mutateAsync({
                    data: {
                        host: values.imapHost,
                        port: parseInt(values.imapPort, 10),
                        username: values.username,
                        password: values.password,
                        security: values.security,
                        mailbox: values.mailbox,
                    },
                });
                setMailboxCount(countResult.data?.count || 0);
            }

            // Save the configuration (enabled for automatic new mail processing)
            const result = await saveConfig.mutateAsync({
                data: {
                    host: values.imapHost,
                    port: parseInt(values.imapPort, 10),
                    username: values.username,
                    password: values.password,
                    security: values.security,
                    mailbox: values.mailbox,
                    enabled: true, // Always enabled for automatic new mail processing
                },
            });

            if (result.data) {
                setTestStatus({
                    isConnected: result.data.isConnected,
                    messageCount: result.data.messageCount,
                    lastError: result.data.lastError,
                });
                
                showSuccessToast({
                    title: "Settings saved",
                    description: "IMAP configuration has been saved successfully.",
                });

                // Show import dialog for first time setup
                if (isFirstTime && mailboxCount > 0) {
                    setShowImportDialog(true);
                }
            }
        } catch (error) {
            showPersistentErrorToast({
                title: "Save failed",
                description: error instanceof Error ? error.message : "An unknown error occurred.",
            });
        }
    };

    const handleProcessExistingEmails = async () => {
        const values = form.getValues();
        
        try {
            const result = await processExistingEmails.mutateAsync({
                data: {
                    host: values.imapHost,
                    port: parseInt(values.imapPort, 10),
                    username: values.username,
                    password: values.password,
                    security: values.security,
                    mailbox: values.mailbox,
                    enabled: true,
                },
            });

            if (result.data?.success) {
                showSuccessToast({
                    title: "Import completed",
                    description: `${result.data.processedCount} emails have been imported and processed.`,
                });
                // Refresh history to show imported emails
                queryClient.invalidateQueries({ queryKey: getJobControllerGetHistoryQueryKey({ source: "IMAP" }) });
                queryClient.invalidateQueries({ queryKey: getJobControllerGetHistoryQueryKey({}) });
            }
        } catch (error) {
            showPersistentErrorToast({
                title: "Import failed",
                description: error instanceof Error ? error.message : "Failed to process existing emails.",
            });
        } finally {
            setShowImportDialog(false);
        }
    };

    const isLoading = isLoadingStatus || isLoadingConfig;

    const renderStatusBadge = () => {
        if (isLoading) {
            return (
                <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading...</span>
                </div>
            );
        }

        if (testConnection.isPending) {
            return (
                <div className="flex items-center gap-2 text-blue-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Testing connection...</span>
                </div>
            );
        }

        if (testStatus) {
            if (testStatus.isConnected) {
                return (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm font-medium">
                            Connected • {testStatus.messageCount} messages
                        </span>
                    </div>
                );
            } else {
                return (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">
                            Connection failed • {testStatus.lastError}
                        </span>
                    </div>
                );
            }
        }

        if (statusData?.data?.isEnabled) {
            return (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">
                        Configuration saved but not tested
                    </span>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2 text-slate-500">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">Not configured</span>
            </div>
        );
    };

    return (
        <SettingsSection
            title="Mail"
            description="Connect an IMAP mailbox so incoming emails can be imported into Sieve."
        >
            <form className="space-y-6">
                {/* Status Indicator */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <StyledLabel className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Connection Status
                    </StyledLabel>
                    {renderStatusBadge()}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <StyledLabel>IMAP Server</StyledLabel>
                        <Controller
                            name="imapHost"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-1">
                                    <StyledInput
                                        {...field}
                                        placeholder="imap.example.com"
                                        aria-invalid={fieldState.invalid}
                                        disabled={isLoading}
                                    />
                                    {fieldState.error && (
                                        <p className="text-xs text-red-500">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <StyledLabel>Port</StyledLabel>
                        <Controller
                            name="imapPort"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-1">
                                    <StyledInput
                                        {...field}
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="993"
                                        aria-invalid={fieldState.invalid}
                                        disabled={isLoading}
                                    />
                                    {fieldState.error && (
                                        <p className="text-xs text-red-500">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <StyledLabel>Username</StyledLabel>
                        <Controller
                            name="username"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-1">
                                    <StyledInput
                                        {...field}
                                        placeholder="you@example.com"
                                        aria-invalid={fieldState.invalid}
                                        disabled={isLoading}
                                    />
                                    {fieldState.error && (
                                        <p className="text-xs text-red-500">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <StyledLabel>Password</StyledLabel>
                        <Controller
                            name="password"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-1">
                                    <StyledInput
                                        {...field}
                                        type="password"
                                        placeholder="App password"
                                        aria-invalid={fieldState.invalid}
                                        disabled={isLoading}
                                    />
                                    {fieldState.error && (
                                        <p className="text-xs text-red-500">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <StyledLabel>Connection Security</StyledLabel>
                        <Controller
                            name="security"
                            control={form.control}
                            render={({ field }) => (
                                <StyledSelect
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={isLoading}
                                >
                                    <StyledSelectTrigger>
                                        <StyledSelectValue placeholder="Select security" />
                                    </StyledSelectTrigger>
                                    <StyledSelectContent>
                                        <StyledSelectItem value="ssl">
                                            SSL/TLS (recommended)
                                        </StyledSelectItem>
                                        <StyledSelectItem value="starttls">
                                            STARTTLS
                                        </StyledSelectItem>
                                        <StyledSelectItem value="none">
                                            None
                                        </StyledSelectItem>
                                    </StyledSelectContent>
                                </StyledSelect>
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <StyledLabel>Mailbox</StyledLabel>
                        <Controller
                            name="mailbox"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-1">
                                    <StyledInput
                                        {...field}
                                        placeholder="INBOX"
                                        aria-invalid={fieldState.invalid}
                                        disabled={isLoading}
                                    />
                                    {fieldState.error && (
                                        <p className="text-xs text-red-500">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    </div>
                </div>

                {/* Info Box */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                    <div className="flex items-start gap-3">
                        <Mail className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Automatic Email Processing
                            </p>
                            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                                Once connected, new emails will be automatically processed. 
                                On first setup, you can choose to import existing emails.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
                        Test the connection before saving to ensure your settings are correct.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <StyledButton
                            type="button"
                            sizeVariant="medium"
                            onClick={form.handleSubmit(handleTestConnection)}
                            isLoading={testConnection.isPending}
                            disabled={!form.formState.isValid || testConnection.isPending || isLoading}
                            label="Test Connection"
                            loadingLabel="Testing..."
                            className="w-full bg-slate-600 text-white hover:bg-slate-500 shadow-slate-900/20 disabled:bg-slate-600/50 sm:w-auto sm:min-w-[140px]"
                        />
                        <StyledButton
                            type="button"
                            sizeVariant="medium"
                            onClick={form.handleSubmit(handleSaveConfig)}
                            isLoading={saveConfig.isPending || testConnection.isPending || getMailboxCount.isPending}
                            disabled={!form.formState.isValid || saveConfig.isPending || testConnection.isPending || isLoading}
                            label="Save Settings"
                            loadingLabel="Saving..."
                            className="w-full sm:w-auto sm:min-w-[140px]"
                        />
                    </div>
                </div>
            </form>

            {/* Import Dialog */}
            {showImportDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Import Existing Emails?
                            </h3>
                        </div>
                        
                        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                            Your mailbox contains <strong>{mailboxCount}</strong> messages. 
                            Would you like to import and process these existing emails?
                        </p>
                        
                        <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">
                            All future new emails will be automatically processed. This action only imports existing messages.
                        </p>
                        
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowImportDialog(false)}
                                className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Skip
                            </button>
                            <button
                                type="button"
                                onClick={handleProcessExistingEmails}
                                disabled={processExistingEmails.isPending}
                                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                            >
                                {processExistingEmails.isPending ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Importing...
                                    </span>
                                ) : (
                                    `Import ${mailboxCount} Emails`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SettingsSection>
    );
}
