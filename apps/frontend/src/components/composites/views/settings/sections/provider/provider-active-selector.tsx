"use client";

import { StyledButton } from "@/components/ui/styled-button";
import { StyledLabel } from "@/components/ui/styled-label";
import {
    StyledSelect,
    StyledSelectContent,
    StyledSelectItem,
    StyledSelectTrigger,
    StyledSelectValue,
} from "@/components/ui/styled-select";
import type {
    ProviderSettingsDto,
    UpdateInstanceActiveProviderDtoProvider,
} from "@/lib/client/models";

type ProviderActiveSelectorProps = {
    selectableProviders: ProviderSettingsDto[];
    selectedProvider: UpdateInstanceActiveProviderDtoProvider;
    onProviderChangeAction: (
        provider: UpdateInstanceActiveProviderDtoProvider,
    ) => void;
    onSaveAction: () => void;
    isSaving: boolean;
};

export function ProviderActiveSelector({
    selectableProviders,
    selectedProvider,
    onProviderChangeAction,
    onSaveAction,
    isSaving,
}: ProviderActiveSelectorProps) {
    const isDisabled = selectableProviders.length === 0 || isSaving;

    return (
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 px-4 py-3 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/45">
            <div className="flex flex-col gap-2">
                <StyledLabel>Active provider for analysis</StyledLabel>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-56 flex-1">
                        <StyledSelect
                            value={selectedProvider}
                            onValueChange={(value) => {
                                onProviderChangeAction(
                                    value as UpdateInstanceActiveProviderDtoProvider,
                                );
                            }}
                            disabled={isDisabled}
                        >
                            <StyledSelectTrigger>
                                <StyledSelectValue placeholder="Select provider" />
                            </StyledSelectTrigger>
                            <StyledSelectContent>
                                {selectableProviders.map((provider) => (
                                    <StyledSelectItem
                                        key={provider.provider}
                                        value={provider.provider}
                                    >
                                        {provider.displayName}
                                    </StyledSelectItem>
                                ))}
                            </StyledSelectContent>
                        </StyledSelect>
                    </div>
                    <StyledButton
                        label="Use Provider"
                        loadingLabel="Saving..."
                        sizeVariant="small"
                        isLoading={isSaving}
                        disabled={isDisabled}
                        onClick={onSaveAction}
                        className="w-fit"
                    />
                </div>
                {selectableProviders.length === 0 && (
                    <p className="text-xs text-red-700 dark:text-red-300">
                        No provider is currently configured and enabled.
                    </p>
                )}
            </div>
        </div>
    );
}
