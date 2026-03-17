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
    useImapControllerTestConnection,
    useImapControllerSaveConfig,
} from "@/lib/client/imap/imap";
import { showPersistentErrorToast, showSuccessToast } from "@/lib/toast";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const formSchema = z.object({
    imapHost: z
        .string()
        .min(1, "IMAP server is required.")
        .max(255, "IMAP server must be at most 255 characters."),
    imapPort: z
        .coerce
        .number()
        .int("Port must be a whole number.")
        .min(1, "Port must be between 1 and 65535.")
        .max(65535, "Port must be between 1 and 65535."),
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
    enabled: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export function MailSection() {
    const [testStatus, setTestStatus] = useState<{
        isConnected: boolean;
        messageCount?: number;
        lastError?: string;
    } | null>(null);

    const { data: statusData, isLoading: isLoadingStatus } = useImapControllerGetStatus();
    const testConnection = useImapControllerTestConnection();
    const saveConfig = useImapControllerSaveConfig();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            imapHost: "",
            imapPort: 993,
            username: "",
            password: "",
            security: "ssl",
            mailbox: "INBOX",
            enabled: false,
        },
    });

    // Load saved status
    useEffect(() => {
        if (statusData?.data) {
            const status = statusData.data;
            setTestStatus({
                isConnected: status.isConnected,
                messageCount: status.messageCount,
                lastError: status.lastError,
            });
            form.setValue("enabled", status.isEnabled);
        }
    }, [statusData, form]);

    const handleTestConnection = async (values: FormValues) => {
        setTestStatus(null);
        
        try {
            const result = await testConnection.mutateAsync({
                data: {
                    host: values.imapHost,
                    port: values.imapPort,
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
                    port: values.imapPort,
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

            // Save the configuration
            const result = await saveConfig.mutateAsync({
                data: {
                    host: values.imapHost,
                    port: values.imapPort,
                    username: values.username,
                    password: values.password,
                    security: values.security,
                    mailbox: values.mailbox,
                    enabled: values.enabled,
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
            }
        } catch (error) {
            showPersistentErrorToast({
                title: "Save failed",
                description: error instanceof Error ? error.message : "An unknown error occurred.",
            });
        }
    };

    const renderStatusBadge = () => {
        if (isLoadingStatus) {
            return (
                <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading status...</span>
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

                {/* Enable IMAP Toggle */}
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                    <Controller
                        name="enabled"
                        control={form.control}
                        render={({ field }) => (
                            <>
                                <input
                                    type="checkbox"
                                    id="imap-enabled"
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label
                                    htmlFor="imap-enabled"
                                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                                >
                                    Enable automatic email import from IMAP
                                </label>
                            </>
                        )}
                    />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Test the connection before saving to ensure your settings are correct.
                    </p>
                    <div className="flex gap-3">
                        <StyledButton
                            type="button"
                            onClick={form.handleSubmit(handleTestConnection)}
                            isLoading={testConnection.isPending}
                            disabled={!form.formState.isValid || testConnection.isPending}
                            label="Test Connection"
                            loadingLabel="Testing..."
                            className="bg-slate-600 text-white hover:bg-slate-500 shadow-slate-900/20 disabled:bg-slate-600/50"
                        />
                        <StyledButton
                            type="button"
                            onClick={form.handleSubmit(handleSaveConfig)}
                            isLoading={saveConfig.isPending || testConnection.isPending}
                            disabled={!form.formState.isValid || saveConfig.isPending || testConnection.isPending}
                            label="Save Settings"
                            loadingLabel="Saving..."
                        />
                    </div>
                </div>
            </form>
        </SettingsSection>
    );
}
