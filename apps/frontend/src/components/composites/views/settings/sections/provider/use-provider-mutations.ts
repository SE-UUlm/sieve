"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
    getSettingsControllerGetInstanceSettingsQueryKey,
    useSettingsControllerDeleteInstanceApiKey,
    useSettingsControllerUpdateActiveProvider,
    useSettingsControllerUpdateInstanceApiKey,
    useSettingsControllerUpdateInstanceApiKeyEnabled,
    useSettingsControllerUpdateInstanceProviderModels,
    useSettingsControllerValidateInstanceProviderModelAvailability,
} from "@/lib/client";
import type { UpdateInstanceActiveProviderDtoProvider } from "@/lib/client/models";
import { showPersistentErrorToast, showSuccessToast } from "@/lib/toast";

type ProviderMutationAction = "update" | "toggle" | "delete" | "models";

type ActiveProviderMutation = {
    provider: UpdateInstanceActiveProviderDtoProvider;
    action: ProviderMutationAction;
} | null;

type UpdateProviderApiKeyOptions = {
    onSuccess?: () => void;
};

type UpdateProviderModelsOptions = {
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
    const [
        activeModelAvailabilityProvider,
        setActiveModelAvailabilityProvider,
    ] = useState<UpdateInstanceActiveProviderDtoProvider | null>(null);

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

    const updateProviderModelsMutation =
        useSettingsControllerUpdateInstanceProviderModels({
            mutation: {
                onSuccess: async (response) => {
                    if (response.status !== 200) {
                        showPersistentErrorToast({
                            title: "Provider Model Update Failed",
                            description: getProviderSettingsErrorMessage(
                                response.status,
                            ),
                        });
                        return;
                    }

                    await invalidateSettings();
                    showSuccessToast({
                        title: "Provider Models Updated",
                        description:
                            "The simple and complex model settings were saved successfully.",
                    });
                },
                onError: (error) => {
                    console.error(
                        "[settings] Failed to update provider models",
                        error,
                    );
                    showPersistentErrorToast({
                        title: "Provider Model Update Failed",
                        description:
                            "There was an issue with the server. Please try again later.",
                    });
                },
            },
        });

    const validateProviderModelAvailabilityMutation =
        useSettingsControllerValidateInstanceProviderModelAvailability({
            mutation: {
                onError: (error) => {
                    console.error(
                        "[settings] Failed to validate provider model availability",
                        error,
                    );
                    showPersistentErrorToast({
                        title: "Model Availability Check Failed",
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

    const updateProviderModels = (
        provider: UpdateInstanceActiveProviderDtoProvider,
        simpleModel: string,
        complexModel: string,
        options?: UpdateProviderModelsOptions,
    ) => {
        setActiveProviderMutation({ provider, action: "models" });
        updateProviderModelsMutation.mutate(
            {
                provider,
                data: {
                    simpleModel,
                    complexModel,
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

    const validateProviderModelAvailability = async (
        provider: UpdateInstanceActiveProviderDtoProvider,
        model: string,
    ): Promise<boolean | null> => {
        setActiveModelAvailabilityProvider(provider);
        try {
            const response =
                await validateProviderModelAvailabilityMutation.mutateAsync({
                    provider,
                    data: {
                        model,
                    },
                });

            if (response.status !== 200) {
                showPersistentErrorToast({
                    title: "Model Availability Check Failed",
                    description: getProviderSettingsErrorMessage(
                        response.status,
                    ),
                });
                return null;
            }

            return response.data.isAvailable;
        } finally {
            setActiveModelAvailabilityProvider(null);
        }
    };

    const isProviderMutationBusy =
        updateMutation.isPending ||
        toggleEnabledMutation.isPending ||
        deleteMutation.isPending ||
        updateProviderModelsMutation.isPending ||
        validateProviderModelAvailabilityMutation.isPending;

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

    const isUpdatingProviderModels = (
        provider: UpdateInstanceActiveProviderDtoProvider,
    ) =>
        updateProviderModelsMutation.isPending &&
        activeProviderMutation?.action === "models" &&
        activeProviderMutation.provider === provider;

    const isCheckingProviderModelAvailability = (
        provider: UpdateInstanceActiveProviderDtoProvider,
    ) =>
        validateProviderModelAvailabilityMutation.isPending &&
        activeModelAvailabilityProvider === provider;

    return {
        deleteProviderApiKey,
        isCheckingProviderModelAvailability,
        isDeletingProvider,
        isProviderMutationBusy,
        isSavingActiveProvider: updateActiveProviderMutation.isPending,
        isTogglingProvider,
        isUpdatingProvider,
        isUpdatingProviderModels,
        toggleProviderEnabled,
        updateActiveProvider,
        updateProviderApiKey,
        updateProviderModels,
        validateProviderModelAvailability,
    };
}
