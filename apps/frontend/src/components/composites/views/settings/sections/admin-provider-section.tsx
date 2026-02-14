"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { SettingsSection } from "@/components/composites/views/settings/settings-section";
import { Button } from "@/components/primitives/button";
import { StyledButton } from "@/components/ui/styled-button";
import { StyledInput } from "@/components/ui/styled-input";
import { StyledLabel } from "@/components/ui/styled-label";
import {
    getSettingsControllerGetInstanceSettingsQueryKey,
    useSettingsControllerDeleteInstanceApiKey,
    useSettingsControllerGetInstanceSettings,
    useSettingsControllerUpdateInstanceApiKey,
    useSettingsControllerUpdateInstanceApiKeyEnabled,
} from "@/lib/client";
import { showPersistentErrorToast, showSuccessToast } from "@/lib/toast";

const formSchema = z.object({
    apiKey: z
        .string()
        .min(10, "API key must be at least 10 characters.")
        .max(500, "API key must be at most 500 characters."),
});

type FormValues = z.infer<typeof formSchema>;

export function AdminProviderSection() {
    const queryClient = useQueryClient();

    const settingsQuery = useSettingsControllerGetInstanceSettings({
        query: {
            queryKey: getSettingsControllerGetInstanceSettingsQueryKey(),
            retry: false,
        },
    });

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            apiKey: "",
        },
    });

    const updateMutation = useSettingsControllerUpdateInstanceApiKey({
        mutation: {
            onSuccess: async (response) => {
                if (response.status === 200) {
                    form.reset({ apiKey: "" });
                    await queryClient.invalidateQueries({
                        queryKey:
                            getSettingsControllerGetInstanceSettingsQueryKey(),
                    });
                    showSuccessToast({
                        title: "Provider Updated",
                        description:
                            "The instance-wide API key was updated successfully.",
                    });
                }
            },
            onError: (error) => {
                console.error(
                    "[settings] Failed to update instance API key",
                    error,
                );
                showPersistentErrorToast({
                    title: "Provider Update Failed",
                    description:
                        "There was an issue with the server. Please try again later.",
                });
            },
        },
    });

    const toggleEnabledMutation =
        useSettingsControllerUpdateInstanceApiKeyEnabled({
            mutation: {
                onSuccess: async (response) => {
                    if (response.status === 200) {
                        await queryClient.invalidateQueries({
                            queryKey:
                                getSettingsControllerGetInstanceSettingsQueryKey(),
                        });
                        showSuccessToast({
                            title: response.data.isOpenAIApiKeyEnabled
                                ? "Provider Enabled"
                                : "Provider Disabled",
                            description: response.data.isOpenAIApiKeyEnabled
                                ? "Users can now run email analysis again."
                                : "Email analysis is paused for all users.",
                        });
                    }
                },
                onError: (error) => {
                    console.error(
                        "[settings] Failed to toggle instance API key usage",
                        error,
                    );
                    showPersistentErrorToast({
                        title: "Provider Toggle Failed",
                        description:
                            "There was an issue with the server. Please try again later.",
                    });
                },
            },
        });

    const deleteMutation = useSettingsControllerDeleteInstanceApiKey({
        mutation: {
            onSuccess: async (response) => {
                if (response.status === 200) {
                    form.reset({ apiKey: "" });
                    await queryClient.invalidateQueries({
                        queryKey:
                            getSettingsControllerGetInstanceSettingsQueryKey(),
                    });
                    showSuccessToast({
                        title: "Provider Key Deleted",
                        description:
                            "The instance-wide API key was removed and disabled.",
                    });
                }
            },
            onError: (error) => {
                console.error(
                    "[settings] Failed to delete instance API key",
                    error,
                );
                showPersistentErrorToast({
                    title: "Provider Delete Failed",
                    description:
                        "There was an issue with the server. Please try again later.",
                });
            },
        },
    });

    const isConfigured =
        settingsQuery.data?.status === 200 &&
        settingsQuery.data.data.hasOpenAIApiKey;
    const isEnabled =
        settingsQuery.data?.status === 200 &&
        settingsQuery.data.data.isOpenAIApiKeyEnabled;

    const onToggleProvider = () => {
        if (!isConfigured || settingsQuery.data?.status !== 200) {
            return;
        }

        toggleEnabledMutation.mutate({
            data: {
                enabled: !settingsQuery.data.data.isOpenAIApiKeyEnabled,
            },
        });
    };

    const onDeleteProviderKey = () => {
        deleteMutation.mutate();
    };

    const onSubmit = (values: FormValues) => {
        updateMutation.mutate({
            data: {
                apiKey: values.apiKey,
            },
        });
    };

    return (
        <SettingsSection
            title="Provider"
            description="Set the instance-wide OpenAI API key used for all analyses."
        >
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Current status:{" "}
                        {!isConfigured
                            ? "Not configured"
                            : isEnabled
                              ? "Configured and enabled"
                              : "Configured but disabled"}
                    </p>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            onClick={onToggleProvider}
                            disabled={
                                !isConfigured ||
                                toggleEnabledMutation.isPending ||
                                deleteMutation.isPending
                            }
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            {toggleEnabledMutation.isPending
                                ? "Saving..."
                                : isEnabled
                                  ? "Disable"
                                  : "Enable"}
                        </Button>
                        <Button
                            type="button"
                            onClick={onDeleteProviderKey}
                            disabled={!isConfigured || deleteMutation.isPending}
                            className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30"
                        >
                            {deleteMutation.isPending
                                ? "Deleting..."
                                : "Delete"}
                        </Button>
                    </div>
                </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <StyledLabel>OpenAI API Key</StyledLabel>
                    <Controller
                        name="apiKey"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <div className="space-y-1">
                                <StyledInput
                                    {...field}
                                    type="password"
                                    placeholder="sk-..."
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

                <div className="flex items-center justify-end">
                    <div className="w-full max-w-xs">
                        <StyledButton
                            type="submit"
                            isLoading={updateMutation.isPending}
                            disabled={!form.formState.isValid}
                            label="Update Provider Key"
                            loadingLabel="Updating..."
                        />
                    </div>
                </div>
            </form>
        </SettingsSection>
    );
}
