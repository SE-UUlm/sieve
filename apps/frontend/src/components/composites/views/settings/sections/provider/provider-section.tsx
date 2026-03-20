"use client";

import { useEffect, useMemo, useState } from "react";
import {
    ListSkeleton,
    SkeletonCard,
    TextBlockSkeleton,
} from "@/components/composites/skeletons";
import { ProviderActiveSelector } from "@/components/composites/views/settings/sections/provider/provider-active-selector";
import { ProviderCard } from "@/components/composites/views/settings/sections/provider/provider-card";
import { useProviderMutations } from "@/components/composites/views/settings/sections/provider/use-provider-mutations";
import { SettingsSection } from "@/components/composites/views/settings/settings-section";
import { StyledSkeleton } from "@/components/ui/styled-skeleton";
import {
    getSettingsControllerGetInstanceSettingsQueryKey,
    useSettingsControllerGetInstanceSettings,
} from "@/lib/client";
import type { UpdateInstanceActiveProviderDtoProvider } from "@/lib/client/models";

type ProviderModelValues = {
    simpleModel: string;
    complexModel: string;
};

type ProviderModelValidationState = {
    simple: "unknown" | "valid" | "invalid";
    complex: "unknown" | "valid" | "invalid";
};

function validateApiKey(apiKey: string): string | null {
    const normalizedKey = apiKey.trim();

    if (normalizedKey.length === 0) {
        return "API key cannot be empty.";
    }

    return null;
}

/**
 * Validates simple/complex provider model inputs.
 */
function validateProviderModels(
    simpleModel: string,
    complexModel: string,
): string | null {
    if (!simpleModel.trim()) {
        return "Simple model cannot be empty.";
    }

    if (!complexModel.trim()) {
        return "Complex model cannot be empty.";
    }

    return null;
}

export function ProviderSection() {
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
    const [apiKeyErrors, setApiKeyErrors] = useState<Record<string, string>>(
        {},
    );
    const [providerModels, setProviderModels] = useState<
        Record<string, ProviderModelValues>
    >({});
    const [providerModelErrors, setProviderModelErrors] = useState<
        Record<string, string>
    >({});
    const [
        providerModelAvailabilityFeedback,
        setProviderModelAvailabilityFeedback,
    ] = useState<Record<string, ProviderModelValidationState>>({});
    const [selectedProvider, setSelectedProvider] =
        useState<UpdateInstanceActiveProviderDtoProvider>("OPENAI");

    const settingsQuery = useSettingsControllerGetInstanceSettings({
        query: {
            queryKey: getSettingsControllerGetInstanceSettingsQueryKey(),
            retry: false,
        },
    });

    const providers = useMemo(() => {
        if (settingsQuery.data?.status !== 200) {
            return [];
        }

        return settingsQuery.data.data.providers;
    }, [settingsQuery.data]);

    useEffect(() => {
        if (settingsQuery.data?.status !== 200) {
            return;
        }

        setSelectedProvider(settingsQuery.data.data.activeProvider);
        setProviderModels(
            Object.fromEntries(
                settingsQuery.data.data.providers.map((provider) => [
                    provider.provider,
                    {
                        simpleModel: provider.simpleModel ?? "",
                        complexModel: provider.complexModel ?? "",
                    },
                ]),
            ),
        );
        setProviderModelAvailabilityFeedback(
            Object.fromEntries(
                settingsQuery.data.data.providers.map((provider) => [
                    provider.provider,
                    {
                        simple: "unknown",
                        complex: "unknown",
                    } satisfies ProviderModelValidationState,
                ]),
            ),
        );
    }, [settingsQuery.data]);

    const selectableProviders = useMemo(
        () =>
            providers.filter(
                (provider) => provider.isConfigured && provider.isEnabled,
            ),
        [providers],
    );
    const {
        deleteProviderApiKey,
        isDeletingProvider,
        isProviderMutationBusy,
        isSavingActiveProvider,
        isCheckingProviderModelAvailability,
        isTogglingProvider,
        isUpdatingProvider,
        isUpdatingProviderModels,
        toggleProviderEnabled,
        updateActiveProvider,
        updateProviderApiKey,
        updateProviderModels,
        validateProviderModelAvailability,
    } = useProviderMutations();

    if (settingsQuery.isPending && !settingsQuery.data) {
        return (
            <SettingsSection
                title="Provider"
                description="Configure AI provider settings for this workspace."
            >
                <div className="space-y-3">
                    <SkeletonCard className="space-y-4">
                        <StyledSkeleton className="h-4 w-48" />
                        <div className="flex flex-wrap items-center gap-2">
                            <StyledSkeleton className="h-10 min-w-56 flex-1" />
                            <StyledSkeleton className="h-10 w-28" />
                        </div>
                        <TextBlockSkeleton
                            lineCount={1}
                            lineWidths={["w-3/5"]}
                        />
                    </SkeletonCard>

                    <ListSkeleton itemCount={2} />
                </div>
            </SettingsSection>
        );
    }

    const onUpdateProvider = (
        provider: UpdateInstanceActiveProviderDtoProvider,
    ) => {
        const apiKey = apiKeys[provider] ?? "";
        const validationError = validateApiKey(apiKey);

        if (validationError) {
            setApiKeyErrors((previousState) => ({
                ...previousState,
                [provider]: validationError,
            }));
            return;
        }

        setApiKeyErrors((previousState) => ({
            ...previousState,
            [provider]: "",
        }));

        updateProviderApiKey(provider, apiKey, {
            onSuccess: () => {
                setApiKeys((previousState) => ({
                    ...previousState,
                    [provider]: "",
                }));
                setApiKeyErrors((previousState) => ({
                    ...previousState,
                    [provider]: "",
                }));
            },
        });
    };

    const onUpdateProviderModels = (
        provider: UpdateInstanceActiveProviderDtoProvider,
    ) => {
        const currentProviderModels = providerModels[provider] ?? {
            simpleModel: "",
            complexModel: "",
        };
        const validationError = validateProviderModels(
            currentProviderModels.simpleModel,
            currentProviderModels.complexModel,
        );

        if (validationError) {
            setProviderModelErrors((previousState) => ({
                ...previousState,
                [provider]: validationError,
            }));
            return;
        }

        setProviderModelErrors((previousState) => ({
            ...previousState,
            [provider]: "",
        }));

        updateProviderModels(
            provider,
            currentProviderModels.simpleModel,
            currentProviderModels.complexModel,
            {
                onSuccess: () => {
                    setProviderModelErrors((previousState) => ({
                        ...previousState,
                        [provider]: "",
                    }));
                },
            },
        );
    };

    const onValidateProviderModels = async (
        provider: UpdateInstanceActiveProviderDtoProvider,
    ) => {
        const currentProviderModels = providerModels[provider] ?? {
            simpleModel: "",
            complexModel: "",
        };
        const validationError = validateProviderModels(
            currentProviderModels.simpleModel,
            currentProviderModels.complexModel,
        );

        if (validationError) {
            setProviderModelErrors((previousState) => ({
                ...previousState,
                [provider]: validationError,
            }));
            return;
        }

        setProviderModelErrors((previousState) => ({
            ...previousState,
            [provider]: "",
        }));
        setProviderModelAvailabilityFeedback((previousState) => ({
            ...previousState,
            [provider]: {
                simple: "unknown",
                complex: "unknown",
            },
        }));

        const simpleModelAvailability = await validateProviderModelAvailability(
            provider,
            currentProviderModels.simpleModel.trim(),
        );
        const complexModelAvailability =
            await validateProviderModelAvailability(
                provider,
                currentProviderModels.complexModel.trim(),
            );

        if (
            simpleModelAvailability === null ||
            complexModelAvailability === null
        ) {
            return;
        }

        setProviderModelAvailabilityFeedback((previousState) => ({
            ...previousState,
            [provider]: {
                simple: simpleModelAvailability ? "valid" : "invalid",
                complex: complexModelAvailability ? "valid" : "invalid",
            },
        }));
    };

    return (
        <SettingsSection
            title="Provider"
            description="Configure AI provider settings for this workspace."
        >
            <div className="space-y-3">
                <ProviderActiveSelector
                    selectableProviders={selectableProviders}
                    selectedProvider={selectedProvider}
                    onProviderChangeAction={setSelectedProvider}
                    onSaveAction={() => {
                        updateActiveProvider(selectedProvider);
                    }}
                    isSaving={isSavingActiveProvider}
                />

                {providers.map((provider, index) => (
                    <ProviderCard
                        key={provider.provider}
                        provider={provider}
                        openByDefault={index === 0}
                        apiKeyValue={apiKeys[provider.provider] ?? ""}
                        simpleModelValue={
                            providerModels[provider.provider]?.simpleModel ?? ""
                        }
                        complexModelValue={
                            providerModels[provider.provider]?.complexModel ??
                            ""
                        }
                        apiKeyError={apiKeyErrors[provider.provider]}
                        modelError={providerModelErrors[provider.provider]}
                        simpleModelValidationState={
                            providerModelAvailabilityFeedback[provider.provider]
                                ?.simple
                        }
                        complexModelValidationState={
                            providerModelAvailabilityFeedback[provider.provider]
                                ?.complex
                        }
                        isBusy={isProviderMutationBusy}
                        isUpdating={isUpdatingProvider(provider.provider)}
                        isUpdatingModels={isUpdatingProviderModels(
                            provider.provider,
                        )}
                        isToggling={isTogglingProvider(provider.provider)}
                        isDeleting={isDeletingProvider(provider.provider)}
                        isCheckingModelAvailability={isCheckingProviderModelAvailability(
                            provider.provider,
                        )}
                        onApiKeyChangeAction={(value) => {
                            setApiKeys((previousState) => ({
                                ...previousState,
                                [provider.provider]: value,
                            }));
                            setApiKeyErrors((previousState) => ({
                                ...previousState,
                                [provider.provider]: "",
                            }));
                        }}
                        onSimpleModelChangeAction={(value) => {
                            setProviderModels((previousState) => ({
                                ...previousState,
                                [provider.provider]: {
                                    simpleModel: value,
                                    complexModel:
                                        previousState[provider.provider]
                                            ?.complexModel ?? "",
                                },
                            }));
                            setProviderModelErrors((previousState) => ({
                                ...previousState,
                                [provider.provider]: "",
                            }));
                            setProviderModelAvailabilityFeedback(
                                (previousState) => ({
                                    ...previousState,
                                    [provider.provider]: {
                                        simple: "unknown",
                                        complex: "unknown",
                                    },
                                }),
                            );
                        }}
                        onComplexModelChangeAction={(value) => {
                            setProviderModels((previousState) => ({
                                ...previousState,
                                [provider.provider]: {
                                    simpleModel:
                                        previousState[provider.provider]
                                            ?.simpleModel ?? "",
                                    complexModel: value,
                                },
                            }));
                            setProviderModelErrors((previousState) => ({
                                ...previousState,
                                [provider.provider]: "",
                            }));
                            setProviderModelAvailabilityFeedback(
                                (previousState) => ({
                                    ...previousState,
                                    [provider.provider]: {
                                        simple: "unknown",
                                        complex: "unknown",
                                    },
                                }),
                            );
                        }}
                        onUpdateApiKeyAction={() => {
                            onUpdateProvider(provider.provider);
                        }}
                        onUpdateModelsAction={() => {
                            onUpdateProviderModels(provider.provider);
                        }}
                        onValidateModelsAction={() => {
                            void onValidateProviderModels(provider.provider);
                        }}
                        onToggleEnabledAction={() => {
                            toggleProviderEnabled(
                                provider.provider,
                                !provider.isEnabled,
                            );
                        }}
                        onDeleteKeyAction={() => {
                            deleteProviderApiKey(provider.provider);
                        }}
                    />
                ))}
            </div>
        </SettingsSection>
    );
}
