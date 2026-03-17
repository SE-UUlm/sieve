"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
    getSettingsControllerGetInstanceSettingsQueryKey,
    useSettingsControllerDeleteInstanceApiKey,
    useSettingsControllerUpdateActiveProvider,
    useSettingsControllerUpdateInstanceApiKey,
    useSettingsControllerUpdateInstanceApiKeyEnabled,
} from "@/lib/client";
import type { UpdateInstanceActiveProviderDtoProvider } from "@/lib/client/models";
import { showPersistentErrorToast, showSuccessToast } from "@/lib/toast";

type ProviderMutationAction = "update" | "toggle" | "delete";

type ActiveProviderMutation = {
    provider: UpdateInstanceActiveProviderDtoProvider;
    action: ProviderMutationAction;
} | null;

type UpdateProviderApiKeyOptions = {
    onSuccess?: () => void;
};

function getProviderSettingsErrorMessage(status: number): string {
    if (status === 401 || status === 403) {
        return "You are not authorized to perform this action.";
    }

    if (status === 400) {
        return "The provided value is invalid.";
    }

    return "There was an issue with the server. Please try again later.";
}

export function useProviderMutations() {
    const queryClient = useQueryClient();
    const [activeProviderMutation, setActiveProviderMutation] =
        useState<ActiveProviderMutation>(null);

    const invalidateSettings = async () => {
        await queryClient.invalidateQueries({
            queryKey: getSettingsControllerGetInstanceSettingsQueryKey(),
        });
    };

    const updateActiveProviderMutation =
        useSettingsControllerUpdateActiveProvider({
            mutation: {
                onSuccess: async (response) => {
                    if (response.status !== 200) {
                        showPersistentErrorToast({
                            title: "Active Provider Update Failed",
                            description: getProviderSettingsErrorMessage(
                                response.status,
                            ),
                        });
                        return;
                    }

                    await invalidateSettings();
                    showSuccessToast({
                        title: "Active Provider Updated",
                        description:
                            "New analyses will now use the selected provider.",
                    });
                },
                onError: (error) => {
                    console.error(
                        "[settings] Failed to update active provider",
                        error,
                    );
                    showPersistentErrorToast({
                        title: "Active Provider Update Failed",
                        description:
                            "There was an issue with the server. Please try again later.",
                    });
                },
            },
        });

    const updateMutation = useSettingsControllerUpdateInstanceApiKey({
        mutation: {
            onSuccess: async (response) => {
                if (response.status !== 200) {
                    showPersistentErrorToast({
                        title: "Provider Update Failed",
                        description: getProviderSettingsErrorMessage(
                            response.status,
                        ),
                    });
                    return;
                }

                await invalidateSettings();
                showSuccessToast({
                    title: "Provider Updated",
                    description:
                        "The provider API key was updated successfully.",
                });
            },
            onError: (error) => {
                console.error(
                    "[settings] Failed to update provider API key",
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
                    if (response.status !== 200) {
                        showPersistentErrorToast({
                            title: "Provider Toggle Failed",
                            description: getProviderSettingsErrorMessage(
                                response.status,
                            ),
                        });
                        return;
                    }

                    await invalidateSettings();
                    showSuccessToast({
                        title: "Provider Status Updated",
                        description:
                            "The provider enabled state was updated successfully.",
                    });
                },
                onError: (error) => {
                    console.error(
                        "[settings] Failed to toggle provider API key usage",
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
                if (response.status !== 200) {
                    showPersistentErrorToast({
                        title: "Provider Delete Failed",
                        description: getProviderSettingsErrorMessage(
                            response.status,
                        ),
                    });
                    return;
                }

                await invalidateSettings();
                showSuccessToast({
                    title: "Provider Key Deleted",
                    description:
                        "The provider API key was removed and disabled.",
                });
            },
            onError: (error) => {
                console.error(
                    "[settings] Failed to delete provider API key",
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

    const updateActiveProvider = (
        provider: UpdateInstanceActiveProviderDtoProvider,
    ) => {
        updateActiveProviderMutation.mutate({
            data: {
                provider,
            },
        });
    };

    const updateProviderApiKey = (
        provider: UpdateInstanceActiveProviderDtoProvider,
        apiKey: string,
        options?: UpdateProviderApiKeyOptions,
    ) => {
        setActiveProviderMutation({ provider, action: "update" });
        updateMutation.mutate(
            {
                provider,
                data: {
                    apiKey,
                },
            },
            {
                onSuccess: (response) => {
                    if (response.status === 200) {
                        options?.onSuccess?.();
                    }
                },
                onSettled: () => {
                    setActiveProviderMutation(null);
                },
            },
        );
    };

    const toggleProviderEnabled = (
        provider: UpdateInstanceActiveProviderDtoProvider,
        enabled: boolean,
    ) => {
        setActiveProviderMutation({ provider, action: "toggle" });
        toggleEnabledMutation.mutate(
            {
                provider,
                data: {
                    enabled,
                },
            },
            {
                onSettled: () => {
                    setActiveProviderMutation(null);
                },
            },
        );
    };

    const deleteProviderApiKey = (
        provider: UpdateInstanceActiveProviderDtoProvider,
    ) => {
        setActiveProviderMutation({ provider, action: "delete" });
        deleteMutation.mutate(
            {
                provider,
            },
            {
                onSettled: () => {
                    setActiveProviderMutation(null);
                },
            },
        );
    };

    const isProviderMutationBusy =
        updateMutation.isPending ||
        toggleEnabledMutation.isPending ||
        deleteMutation.isPending;

    const isUpdatingProvider = (
        provider: UpdateInstanceActiveProviderDtoProvider,
    ) =>
        updateMutation.isPending &&
        activeProviderMutation?.action === "update" &&
        activeProviderMutation.provider === provider;

    const isTogglingProvider = (
        provider: UpdateInstanceActiveProviderDtoProvider,
    ) =>
        toggleEnabledMutation.isPending &&
        activeProviderMutation?.action === "toggle" &&
        activeProviderMutation.provider === provider;

    const isDeletingProvider = (
        provider: UpdateInstanceActiveProviderDtoProvider,
    ) =>
        deleteMutation.isPending &&
        activeProviderMutation?.action === "delete" &&
        activeProviderMutation.provider === provider;

    return {
        deleteProviderApiKey,
        isDeletingProvider,
        isProviderMutationBusy,
        isSavingActiveProvider: updateActiveProviderMutation.isPending,
        isTogglingProvider,
        isUpdatingProvider,
        toggleProviderEnabled,
        updateActiveProvider,
        updateProviderApiKey,
    };
}
