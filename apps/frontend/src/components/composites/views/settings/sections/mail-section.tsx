"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
    AlertCircle,
    CheckCircle2,
    FolderOpen,
    Loader2,
    XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
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
    useImapControllerGetConfig,
    useImapControllerGetStatus,
    useImapControllerListFolders,
    useImapControllerSaveConfig,
    useImapControllerTestConnection,
} from "@/lib/client/imap/imap";
import { showPersistentErrorToast, showSuccessToast } from "@/lib/toast";
import { FolderSelectDialog } from "./folder-select-dialog";

const formSchema = z.object({
    imapHost: z
        .string()
        .min(1, "IMAP server is required.")
        .max(255, "IMAP server must be at most 255 characters."),
    imapPort: z
        .string()
        .min(1, "Port is required.")
        .refine((v) => {
            const n = parseInt(v, 10);
            return !Number.isNaN(n) && n >= 1 && n <= 65535;
        }, "Port must be a number between 1 and 65535."),
    username: z
        .string()
        .min(1, "Username is required.")
        .max(255, "Username must be at most 255 characters."),
    password: z.string().min(1, "Password is required."),
    security: z.enum(["ssl", "starttls", "none"]),
    autoProcessEnabled: z.boolean(),
    autoSendThreshold: z.number().int().min(0).max(100).nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export function MailSection() {
    const [testStatus, setTestStatus] = useState<{
        isConnected: boolean;
        messageCount?: number;
        lastError?: string;
    } | null>(null);
    const [selectedMailbox, setSelectedMailbox] = useState<string | null>(null);
    const [showFolderDialog, setShowFolderDialog] = useState(false);
    const [availableFolders, setAvailableFolders] = useState<string[]>([]);
    const [pendingFormValues, setPendingFormValues] =
        useState<FormValues | null>(null);

    const { data: statusData, isLoading: isLoadingStatus } =
        useImapControllerGetStatus();
    const { data: configData, isLoading: isLoadingConfig } =
        useImapControllerGetConfig();
    const testConnection = useImapControllerTestConnection();
    const saveConfig = useImapControllerSaveConfig();
    const listFolders = useImapControllerListFolders();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            imapHost: "",
            imapPort: "993",
            username: "",
            password: "",
            security: "ssl",
            autoProcessEnabled: false,
            autoSendThreshold: null,
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
                autoProcessEnabled: config.autoProcessEnabled ?? false,
                autoSendThreshold: config.autoSendThreshold ?? null,
            });
            if (config.mailbox) {
                setSelectedMailbox(config.mailbox);
            }
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

        if (!selectedMailbox) {
            showPersistentErrorToast({
                title: "No mailbox selected",
                description:
                    "Please save settings first to select a mailbox folder.",
            });
            return;
        }

        try {
            const result = await testConnection.mutateAsync({
                data: {
                    host: values.imapHost,
                    port: parseInt(values.imapPort, 10),
                    username: values.username,
                    password: values.password,
                    security: values.security,
                    mailbox: selectedMailbox,
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
                        description: `Found ${result.data.messageCount} messages in ${selectedMailbox}.`,
                    });
                } else {
                    showPersistentErrorToast({
                        title: "Connection failed",
                        description:
                            result.data.lastError ||
                            "Could not connect to IMAP server.",
                    });
                }
            }
        } catch (error) {
            showPersistentErrorToast({
                title: "Connection test failed",
                description:
                    error instanceof Error
                        ? error.message
                        : "An unknown error occurred.",
            });
        }
    };

    const handleSaveConfig = async (values: FormValues) => {
        try {
            const foldersResult = await listFolders.mutateAsync({
                data: {
                    host: values.imapHost,
                    port: parseInt(values.imapPort, 10),
                    username: values.username,
                    password: values.password,
                    security: values.security,
                },
            });

            if (foldersResult.data?.folders) {
                setAvailableFolders(foldersResult.data.folders);
                setPendingFormValues(values);
                setShowFolderDialog(true);
            }
        } catch (error) {
            showPersistentErrorToast({
                title: "Could not connect",
                description:
                    error instanceof Error
                        ? error.message
                        : "Failed to reach the IMAP server.",
            });
        }
    };

    const handleFolderSelect = async (folder: string) => {
        if (!pendingFormValues) return;
        setShowFolderDialog(false);

        try {
            const result = await saveConfig.mutateAsync({
                data: {
                    host: pendingFormValues.imapHost,
                    port: parseInt(pendingFormValues.imapPort, 10),
                    username: pendingFormValues.username,
                    password: pendingFormValues.password,
                    security: pendingFormValues.security,
                    mailbox: folder,
                    enabled: true,
                    autoProcessEnabled: pendingFormValues.autoProcessEnabled,
                    autoSendThreshold: pendingFormValues.autoSendThreshold ?? null,
                },
            });

            if (result.data) {
                setTestStatus({
                    isConnected: result.data.isConnected,
                    messageCount: result.data.messageCount,
                    lastError: result.data.lastError,
                });
                setSelectedMailbox(folder);
                showSuccessToast({
                    title: "Settings saved",
                    description: `IMAP configured with folder "${folder}".`,
                });
            }
        } catch (error) {
            showPersistentErrorToast({
                title: "Save failed",
                description:
                    error instanceof Error
                        ? error.message
                        : "An unknown error occurred.",
            });
        } finally {
            setPendingFormValues(null);
        }
    };

    const isLoading = isLoadingStatus || isLoadingConfig;
    const isSaving = listFolders.isPending || saveConfig.isPending;

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

                    {/* Mailbox — read-only display */}
                    <div className="space-y-2">
                        <StyledLabel>Inbox Folder</StyledLabel>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
                            <FolderOpen className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="truncate text-sm text-slate-700 dark:text-slate-300">
                                {selectedMailbox ?? (
                                    <span className="italic text-slate-400 dark:text-slate-500">
                                        Selected on save
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Automatic processing toggle */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <Controller
                        name="autoProcessEnabled"
                        control={form.control}
                        render={({ field }) => (
                            <label className="flex cursor-pointer items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-blue-600"
                                    disabled={isLoading}
                                />
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        Automatic email processing
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        When enabled, new emails arriving after
                                        this point are automatically analyzed
                                        and moved to the processed folder.
                                    </p>
                                </div>
                            </label>
                        )}
                    />
                </div>

                {/* Auto-send confidence threshold */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                    <Controller
                        name="autoSendThreshold"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <div className="flex flex-col gap-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        Auto-send confidence threshold
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        IMAP responses with a confidence score
                                        at or above this value (0–100) are sent
                                        automatically via SMTP. Leave empty to
                                        disable.
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <StyledInput
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        max={100}
                                        placeholder="e.g. 80 (leave empty to disable)"
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                            field.onChange(
                                                e.target.value === ""
                                                    ? null
                                                    : Number(e.target.value),
                                            )
                                        }
                                        disabled={isLoading}
                                    />
                                    {fieldState.error && (
                                        <p className="text-xs text-red-500">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    />
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
                        Saving will connect to your server and let you choose
                        the inbox folder.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <StyledButton
                            type="button"
                            sizeVariant="medium"
                            onClick={form.handleSubmit(handleTestConnection)}
                            isLoading={testConnection.isPending}
                            disabled={
                                !form.formState.isValid ||
                                testConnection.isPending ||
                                isLoading ||
                                !selectedMailbox
                            }
                            label="Test Connection"
                            loadingLabel="Testing..."
                            className="w-full bg-slate-600 text-white hover:bg-slate-500 shadow-slate-900/20 disabled:bg-slate-600/50 sm:w-auto sm:min-w-[140px]"
                        />
                        <StyledButton
                            type="button"
                            sizeVariant="medium"
                            onClick={form.handleSubmit(handleSaveConfig)}
                            isLoading={isSaving}
                            disabled={
                                !form.formState.isValid || isSaving || isLoading
                            }
                            label="Save Settings"
                            loadingLabel="Connecting..."
                            className="w-full sm:w-auto sm:min-w-[140px]"
                        />
                    </div>
                </div>
            </form>

            {showFolderDialog && (
                <FolderSelectDialog
                    folders={availableFolders}
                    onSelect={handleFolderSelect}
                    onCancel={() => {
                        setShowFolderDialog(false);
                        setPendingFormValues(null);
                    }}
                />
            )}
        </SettingsSection>
    );
}
