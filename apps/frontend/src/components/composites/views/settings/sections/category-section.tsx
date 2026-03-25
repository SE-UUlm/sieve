"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SettingsSection } from "@/components/composites/views/settings/settings-section";
import { StyledButton } from "@/components/ui/styled-button";
import { StyledLabel } from "@/components/ui/styled-label";
import { StyledSkeleton } from "@/components/ui/styled-skeleton";
import { StyledTextarea } from "@/components/ui/styled-textarea";
import {
    getSettingsControllerGetInstanceSettingsQueryKey,
    useSettingsControllerGetInstanceSettings,
    useSettingsControllerUpdateInstanceCategories,
} from "@/lib/client";
import type { AnalysisCategoryDto } from "@/lib/client/models";
import { showPersistentErrorToast, showSuccessToast } from "@/lib/toast";

type ParseCategoriesResult =
    | { categories: AnalysisCategoryDto[]; error: null }
    | { categories: null; error: string };

/**
 * Converts category payload to formatted JSON for textarea editing.
 */
function stringifyCategories(categories: AnalysisCategoryDto[]): string {
    return JSON.stringify(categories, null, 2);
}

/**
 * Validates and parses admin-provided categories JSON into API payload type.
 */
function parseCategoriesJson(input: string): ParseCategoriesResult {
    let parsed: unknown;
    try {
        parsed = JSON.parse(input);
    } catch {
        return {
            categories: null,
            error: "Invalid JSON. Please provide valid JSON before saving.",
        };
    }

    if (!Array.isArray(parsed)) {
        return {
            categories: null,
            error: "Categories JSON must be an array of category objects.",
        };
    }

    if (parsed.length === 0) {
        return {
            categories: null,
            error: "At least one category must be provided.",
        };
    }

    for (const [index, item] of parsed.entries()) {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
            return {
                categories: null,
                error: `Category at index ${index} must be an object.`,
            };
        }
        const category = item as Record<string, unknown>;
        const name = category.name;
        const description = category.description;
        const flow = category.flow;

        if (typeof name !== "string" || name.trim().length === 0) {
            return {
                categories: null,
                error: `Category at index ${index} must include a non-empty string 'name'.`,
            };
        }
        if (
            typeof description !== "string" ||
            description.trim().length === 0
        ) {
            return {
                categories: null,
                error: `Category '${name}' must include a non-empty string 'description'.`,
            };
        }
        if (!flow || typeof flow !== "object" || Array.isArray(flow)) {
            return {
                categories: null,
                error: `Category '${name}' must include an object 'flow'.`,
            };
        }

        const flowRecord = flow as Record<string, unknown>;
        const flowName = flowRecord.name;
        if (flowName !== "simple" && flowName !== "product") {
            return {
                categories: null,
                error: `Category '${name}' has invalid flow.name. Expected 'simple' or 'product'.`,
            };
        }

        const structuredResponseSchema = flowRecord.structured_response_schema;
        if (
            !structuredResponseSchema ||
            typeof structuredResponseSchema !== "object" ||
            Array.isArray(structuredResponseSchema)
        ) {
            return {
                categories: null,
                error: `Category '${name}' must include object flow.structured_response_schema.`,
            };
        }
    }

    return {
        categories: parsed as AnalysisCategoryDto[],
        error: null,
    };
}

function getCategorySettingsErrorMessage(status: number): string {
    if (status === 401 || status === 403) {
        return "You are not authorized to perform this action.";
    }
    if (status === 400) {
        return "The categories payload is invalid.";
    }
    return "There was an issue with the server. Please try again later.";
}

export function CategorySection() {
    const queryClient = useQueryClient();
    const [categoriesJson, setCategoriesJson] = useState("[]");
    const [initialCategoriesJson, setInitialCategoriesJson] = useState("[]");
    const [isDirty, setIsDirty] = useState(false);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const settingsQuery = useSettingsControllerGetInstanceSettings({
        query: {
            queryKey: getSettingsControllerGetInstanceSettingsQueryKey(),
            retry: false,
        },
    });

    const updateCategoriesMutation =
        useSettingsControllerUpdateInstanceCategories({
            mutation: {
                onSuccess: async (response) => {
                    if (response.status !== 200) {
                        showPersistentErrorToast({
                            title: "Category Update Failed",
                            description: getCategorySettingsErrorMessage(
                                response.status,
                            ),
                        });
                        return;
                    }

                    await queryClient.invalidateQueries({
                        queryKey:
                            getSettingsControllerGetInstanceSettingsQueryKey(),
                    });

                    showSuccessToast({
                        title: "Categories Updated",
                        description:
                            "Analysis categories were saved successfully.",
                    });
                },
                onError: (error) => {
                    console.error(
                        "[settings] Failed to update categories",
                        error,
                    );
                    showPersistentErrorToast({
                        title: "Category Update Failed",
                        description:
                            "There was an issue with the server. Please try again later.",
                    });
                },
            },
        });

    useEffect(() => {
        const settingsData = settingsQuery.data;
        if (!settingsData || settingsData.status !== 200) {
            return;
        }

        const nextJson = stringifyCategories(settingsData.data.categories);
        if (!isInitialized || !isDirty) {
            setCategoriesJson(nextJson);
            setInitialCategoriesJson(nextJson);
            setJsonError(null);
            setIsInitialized(true);
            setIsDirty(false);
        }
    }, [isDirty, isInitialized, settingsQuery.data]);

    const isSaveDisabled = updateCategoriesMutation.isPending || !isDirty;

    const onReset = () => {
        setCategoriesJson(initialCategoriesJson);
        setIsDirty(false);
        setJsonError(null);
    };

    const onFormat = () => {
        const parsed = parseCategoriesJson(categoriesJson);
        if (parsed.error) {
            setJsonError(parsed.error);
            return;
        }
        const formatted = stringifyCategories(parsed.categories);
        setCategoriesJson(formatted);
        setIsDirty(formatted !== initialCategoriesJson);
        setJsonError(null);
    };

    const onSave = () => {
        const parsed = parseCategoriesJson(categoriesJson);
        if (parsed.error) {
            setJsonError(parsed.error);
            return;
        }

        setJsonError(null);
        updateCategoriesMutation.mutate(
            {
                data: {
                    categories: parsed.categories,
                },
            },
            {
                onSuccess: (response) => {
                    if (response.status !== 200) {
                        return;
                    }
                    const nextJson = stringifyCategories(
                        response.data.categories,
                    );
                    setCategoriesJson(nextJson);
                    setInitialCategoriesJson(nextJson);
                    setIsDirty(false);
                    setJsonError(null);
                },
            },
        );
    };

    if (settingsQuery.isPending && !settingsQuery.data) {
        return (
            <SettingsSection
                title="Category"
                description="Manage categories for your workspace."
            >
                <div className="space-y-4">
                    <StyledSkeleton className="h-4 w-44" />
                    <StyledSkeleton className="h-72 w-full" />
                    <div className="flex justify-end gap-2">
                        <StyledSkeleton className="h-9 w-28" />
                        <StyledSkeleton className="h-9 w-28" />
                        <StyledSkeleton className="h-9 w-32" />
                    </div>
                </div>
            </SettingsSection>
        );
    }

    return (
        <SettingsSection
            title="Category"
            description="Manage categories for your workspace."
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <StyledLabel htmlFor="analysis-categories-json">
                        Categories JSON
                    </StyledLabel>
                    <StyledTextarea
                        id="analysis-categories-json"
                        value={categoriesJson}
                        onChange={(event) => {
                            const nextValue = event.target.value;
                            setCategoriesJson(nextValue);
                            setIsDirty(nextValue !== initialCategoriesJson);
                            setJsonError(null);
                        }}
                        placeholder="[]"
                        rows={20}
                        className="min-h-80"
                        aria-invalid={Boolean(jsonError)}
                        aria-describedby={
                            jsonError
                                ? "analysis-categories-json-error"
                                : undefined
                        }
                    />
                    {jsonError && (
                        <p
                            id="analysis-categories-json-error"
                            className="text-xs text-red-700 dark:text-red-300"
                        >
                            {jsonError}
                        </p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Provide the full categories array with each category
                        containing `name`, `description`, and `flow` (including
                        `flow.name` and `flow.structured_response_schema`).
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                    <StyledButton
                        type="button"
                        onClick={onFormat}
                        disabled={updateCategoriesMutation.isPending}
                        label="Format JSON"
                        loadingLabel="Formatting..."
                        sizeVariant="small"
                        className="w-fit shadow-none"
                    />
                    <StyledButton
                        type="button"
                        onClick={onReset}
                        disabled={
                            updateCategoriesMutation.isPending || !isDirty
                        }
                        label="Reset"
                        loadingLabel="Resetting..."
                        sizeVariant="small"
                        className="w-fit shadow-none"
                    />
                    <StyledButton
                        type="button"
                        onClick={onSave}
                        isLoading={updateCategoriesMutation.isPending}
                        disabled={isSaveDisabled}
                        label="Save Categories"
                        loadingLabel="Saving..."
                        sizeVariant="small"
                        className="w-fit shadow-none"
                    />
                </div>
            </div>
        </SettingsSection>
    );
}
