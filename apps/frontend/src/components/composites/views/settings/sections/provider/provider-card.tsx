"use client";

import { CheckCircle2, ChevronDown, XCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { StyledButton } from "@/components/ui/styled-button";
import { StyledInput } from "@/components/ui/styled-input";
import { StyledLabel } from "@/components/ui/styled-label";
import type { ProviderSettingsDto } from "@/lib/client/models";

type ProviderCardProps = {
    provider: ProviderSettingsDto;
    openByDefault?: boolean;
    apiKeyValue: string;
    simpleModelValue: string;
    complexModelValue: string;
    apiKeyError?: string;
    modelError?: string;
    simpleModelValidationState?: "unknown" | "valid" | "invalid";
    complexModelValidationState?: "unknown" | "valid" | "invalid";
    isBusy: boolean;
    isUpdating: boolean;
    isUpdatingModels: boolean;
    isToggling: boolean;
    isDeleting: boolean;
    isCheckingModelAvailability: boolean;
    onApiKeyChangeAction: (value: string) => void;
    onSimpleModelChangeAction: (value: string) => void;
    onComplexModelChangeAction: (value: string) => void;
    onUpdateApiKeyAction: () => void;
    onUpdateModelsAction: () => void;
    onValidateModelsAction: () => void;
    onToggleEnabledAction: () => void;
    onDeleteKeyAction: () => void;
};

export function ProviderCard({
    provider,
    openByDefault = false,
    apiKeyValue,
    simpleModelValue,
    complexModelValue,
    apiKeyError,
    modelError,
    simpleModelValidationState = "unknown",
    complexModelValidationState = "unknown",
    isBusy,
    isUpdating,
    isUpdatingModels,
    isToggling,
    isDeleting,
    isCheckingModelAvailability,
    onApiKeyChangeAction,
    onSimpleModelChangeAction,
    onComplexModelChangeAction,
    onUpdateApiKeyAction,
    onUpdateModelsAction,
    onValidateModelsAction,
    onToggleEnabledAction,
    onDeleteKeyAction,
}: ProviderCardProps) {
    const [isOpen, setIsOpen] = useState(openByDefault);
    const simpleModelInputId = `${provider.provider.toLowerCase()}-simple-model`;
    const complexModelInputId = `${provider.provider.toLowerCase()}-complex-model`;
    const modelErrorId = `${provider.provider.toLowerCase()}-models-error`;
    const modelErrorDescribedBy = modelError ? modelErrorId : undefined;
    const providerStatus = !provider.isConfigured
        ? "Not configured"
        : !provider.isModelConfigured
          ? "Configured, models missing"
          : provider.isEnabled
            ? "Configured and enabled"
            : "Configured but disabled";
    const providerStatusClasses = !provider.isConfigured
        ? "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        : !provider.isModelConfigured
          ? "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
          : provider.isEnabled
            ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";

    return (
        <details
            open={isOpen}
            onToggle={(event) => {
                setIsOpen(event.currentTarget.open);
            }}
            className="group rounded-xl border border-slate-200/90 bg-slate-50/80 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/45"
        >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-t-xl px-4 py-3 transition-colors hover:bg-slate-100/70 dark:hover:bg-slate-800/35">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {provider.displayName}
                </p>
                <ChevronDown className="size-4 text-slate-500 transition-transform group-open:rotate-180" />
            </summary>

            <div className="space-y-5 border-t border-slate-200/90 bg-white px-4 py-4 dark:border-slate-700/70 dark:bg-slate-900/70">
                <div className="mb-4 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Current status:
                            </p>
                            <Badge
                                variant="outline"
                                className={providerStatusClasses}
                            >
                                {providerStatus}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                onClick={onToggleEnabledAction}
                                disabled={!provider.isConfigured || isBusy}
                                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                {isToggling
                                    ? "Saving..."
                                    : provider.isEnabled
                                      ? "Disable"
                                      : "Enable"}
                            </Button>
                            <Button
                                type="button"
                                onClick={onDeleteKeyAction}
                                disabled={!provider.isConfigured || isBusy}
                                className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/30"
                            >
                                {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <StyledLabel>{provider.displayName} API Key</StyledLabel>
                    <StyledInput
                        type="password"
                        value={apiKeyValue}
                        onChange={(event) => {
                            onApiKeyChangeAction(event.target.value);
                        }}
                        placeholder="Enter API key"
                        aria-invalid={Boolean(apiKeyError)}
                    />
                    {apiKeyError && (
                        <p className="text-xs text-red-700 dark:text-red-300">
                            {apiKeyError}
                        </p>
                    )}
                </div>

                <div className="flex justify-end">
                    <StyledButton
                        type="button"
                        onClick={onUpdateApiKeyAction}
                        disabled={isBusy}
                        isLoading={isUpdating}
                        label="Update Provider Key"
                        loadingLabel="Updating..."
                        sizeVariant="small"
                        className="w-fit shadow-none"
                    />
                </div>

                <div className="space-y-4 border-t border-slate-200/90 pt-4 dark:border-slate-700/70">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Provider models
                    </p>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <StyledLabel htmlFor={simpleModelInputId}>
                                Simple model
                            </StyledLabel>
                            {simpleModelValidationState === "valid" && (
                                <CheckCircle2
                                    className="size-4 text-emerald-600 dark:text-emerald-400"
                                    aria-label="Simple model valid"
                                />
                            )}
                            {simpleModelValidationState === "invalid" && (
                                <XCircle
                                    className="size-4 text-red-600 dark:text-red-400"
                                    aria-label="Simple model invalid"
                                />
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <StyledInput
                                id={simpleModelInputId}
                                value={simpleModelValue}
                                onChange={(event) => {
                                    onSimpleModelChangeAction(
                                        event.target.value,
                                    );
                                }}
                                placeholder="e.g. gpt-4o-mini"
                                aria-invalid={Boolean(modelError)}
                                aria-describedby={modelErrorDescribedBy}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <StyledLabel htmlFor={complexModelInputId}>
                                Complex model
                            </StyledLabel>
                            {complexModelValidationState === "valid" && (
                                <CheckCircle2
                                    className="size-4 text-emerald-600 dark:text-emerald-400"
                                    aria-label="Complex model valid"
                                />
                            )}
                            {complexModelValidationState === "invalid" && (
                                <XCircle
                                    className="size-4 text-red-600 dark:text-red-400"
                                    aria-label="Complex model invalid"
                                />
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <StyledInput
                                id={complexModelInputId}
                                value={complexModelValue}
                                onChange={(event) => {
                                    onComplexModelChangeAction(
                                        event.target.value,
                                    );
                                }}
                                placeholder="e.g. gpt-5.2"
                                aria-invalid={Boolean(modelError)}
                                aria-describedby={modelErrorDescribedBy}
                            />
                        </div>
                    </div>

                    {modelError && (
                        <p
                            id={modelErrorId}
                            className="text-xs text-red-700 dark:text-red-300"
                        >
                            {modelError}
                        </p>
                    )}

                    <div className="flex justify-end gap-2">
                        <StyledButton
                            type="button"
                            onClick={onValidateModelsAction}
                            disabled={
                                isBusy ||
                                isCheckingModelAvailability ||
                                !simpleModelValue.trim() ||
                                !complexModelValue.trim()
                            }
                            isLoading={isCheckingModelAvailability}
                            label="Validate Models"
                            loadingLabel="Checking..."
                            sizeVariant="small"
                            className="w-fit shadow-none"
                        />
                        <StyledButton
                            type="button"
                            onClick={onUpdateModelsAction}
                            disabled={
                                isBusy ||
                                !simpleModelValue.trim() ||
                                !complexModelValue.trim()
                            }
                            isLoading={isUpdatingModels}
                            label="Save Models"
                            loadingLabel="Saving..."
                            sizeVariant="small"
                            className="w-fit shadow-none"
                        />
                    </div>
                </div>
            </div>
        </details>
    );
}
