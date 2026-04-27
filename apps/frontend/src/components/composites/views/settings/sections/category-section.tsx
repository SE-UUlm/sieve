"use client";

import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { SettingsSection } from "@/components/composites/views/settings/settings-section";
import { Button } from "@/components/primitives/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/primitives/card";
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
import { StyledSkeleton } from "@/components/ui/styled-skeleton";
import { StyledTextarea } from "@/components/ui/styled-textarea";
import {
    getSettingsControllerGetInstanceSettingsQueryKey,
    useSettingsControllerGetInstanceSettings,
    useSettingsControllerUpdateInstanceCategories,
} from "@/lib/client";
import type { AnalysisCategoryDto } from "@/lib/client/models";
import { showPersistentErrorToast, showSuccessToast } from "@/lib/toast";

function getCategorySettingsErrorMessage(status: number): string {
    if (status === 401 || status === 403) {
        return "You are not authorized to perform this action.";
    }
    if (status === 400) {
        return "The categories payload is invalid.";
    }
    return "There was an issue with the server. Please try again later.";
}

// Helper to validate a JSON string
function validateJsonString(jsonString: string): string | null {
    if (!jsonString.trim()) return "JSON cannot be empty";
    try {
        const parsed = JSON.parse(jsonString);
        if (
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)
        ) {
            return "Must be a valid JSON object";
        }
        if (parsed.type !== "object") {
            return "Schema must have root property 'type': 'object'";
        }
        if (
            !("properties" in parsed) ||
            typeof parsed.properties !== "object" ||
            parsed.properties === null ||
            Array.isArray(parsed.properties)
        ) {
            return "Schema must define a 'properties' object";
        }
        return null;
    } catch {
        return "Invalid JSON formatting";
    }
}

function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (
        a == null ||
        typeof a !== "object" ||
        b == null ||
        typeof b !== "object"
    ) {
        return false;
    }

    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;

    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(objA[key], objB[key]))
            return false;
    }
    return true;
}

export function CategorySection() {
    const queryClient = useQueryClient();
    const [categories, setCategories] = useState<AnalysisCategoryDto[]>([]);
    const [initialCategories, setInitialCategories] = useState<
        AnalysisCategoryDto[]
    >([]);
    const [categoriesSchemasStr, setCategoriesSchemasStr] = useState<
        Record<number, string>
    >({});

    // A mapping from category index to an error message specifically for its JSON schema validation
    const [schemaErrors, setSchemaErrors] = useState<
        Record<number, string | null>
    >({});

    const [isInitialized, setIsInitialized] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

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

        if (!isInitialized) {
            const dataCategories = settingsData.data.categories;
            setCategories(JSON.parse(JSON.stringify(dataCategories))); // deep copy
            setInitialCategories(JSON.parse(JSON.stringify(dataCategories)));

            const schemasStr: Record<number, string> = {};
            dataCategories.forEach((cat, idx) => {
                schemasStr[idx] = JSON.stringify(
                    cat.flow.structured_response_schema || {},
                    null,
                    2,
                );
            });
            setCategoriesSchemasStr(schemasStr);
            setSchemaErrors({});
            setIsInitialized(true);
        }
    }, [isInitialized, settingsQuery.data]);

    const isDirty = !deepEqual(categories, initialCategories);
    const hasSchemaErrors = Object.values(schemaErrors).some(
        (err) => err !== null,
    );

    // Validate custom constraints before save
    const isSaveDisabled =
        updateCategoriesMutation.isPending ||
        !isDirty ||
        hasSchemaErrors ||
        categories.length === 0 ||
        categories.some((cat) => !cat.name.trim() || !cat.description.trim());

    const onReset = () => {
        setCategories(JSON.parse(JSON.stringify(initialCategories)));
        const schemasStr: Record<number, string> = {};
        initialCategories.forEach((cat, idx) => {
            schemasStr[idx] = JSON.stringify(
                cat.flow.structured_response_schema || {},
                null,
                2,
            );
        });
        setCategoriesSchemasStr(schemasStr);
        setSchemaErrors({});
    };

    const onSave = () => {
        if (isSaveDisabled) return;

        updateCategoriesMutation.mutate(
            {
                data: {
                    categories: categories,
                },
            },
            {
                onSuccess: (response) => {
                    if (response.status !== 200) {
                        return;
                    }
                    const updatedCategories = response.data.categories;
                    setCategories(
                        JSON.parse(JSON.stringify(updatedCategories)),
                    );
                    setInitialCategories(
                        JSON.parse(JSON.stringify(updatedCategories)),
                    );

                    const schemasStr: Record<number, string> = {};
                    updatedCategories.forEach((cat, idx) => {
                        schemasStr[idx] = JSON.stringify(
                            cat.flow.structured_response_schema || {},
                            null,
                            2,
                        );
                    });
                    setCategoriesSchemasStr(schemasStr);
                    setSchemaErrors({});
                },
            },
        );
    };

    const updateCategory = (
        index: number,
        updates: Partial<AnalysisCategoryDto>,
    ) => {
        setCategories((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    };

    const updateFlow = (
        index: number,
        flowUpdates: Partial<AnalysisCategoryDto["flow"]>,
    ) => {
        setCategories((prev) => {
            const next = [...prev];
            next[index] = {
                ...next[index],
                flow: { ...next[index].flow, ...flowUpdates },
            };
            return next;
        });
    };

    const handleSchemaStrChange = (index: number, value: string) => {
        setCategoriesSchemasStr((prev) => ({ ...prev, [index]: value }));
        const validationError = validateJsonString(value);
        setSchemaErrors((prev) => ({ ...prev, [index]: validationError }));

        if (!validationError) {
            try {
                const parsed = JSON.parse(value);
                updateFlow(index, { structured_response_schema: parsed });
            } catch {
                // Ignore parsing errors here as they are caught by validationError
            }
        }
    };

    const removeCategory = (index: number) => {
        setCategories((prev) => prev.filter((_, i) => i !== index));
        // Reset schemas for all items
        setCategoriesSchemasStr((_prev) => {
            const next: Record<number, string> = {};
            categories
                .filter((_, i) => i !== index)
                .forEach((cat, idx) => {
                    next[idx] = JSON.stringify(
                        cat.flow.structured_response_schema || {},
                        null,
                        2,
                    );
                });
            return next;
        });
        setSchemaErrors({});
    };

    const addCategory = () => {
        const defaultSchema = {
            type: "object",
            properties: {},
        };

        const newCat: AnalysisCategoryDto = {
            name: "",
            description: "",
            flow: {
                name: "simple", // Type coercion based on API model names
                structured_response_schema: defaultSchema,
            },
        };
        setFocusedIndex(categories.length);
        setCategories((prev) => [...prev, newCat]);
        setCategoriesSchemasStr((prev) => ({
            ...prev,
            [categories.length]: JSON.stringify(defaultSchema, null, 2),
        }));
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
            title="Categories"
            description="Manage analysis categories for your workspace."
        >
            <div className="space-y-6">
                {categories.length === 0 && (
                    <div className="text-sm text-slate-500 italic">
                        No categories defined yet.
                    </div>
                )}

                <div className="space-y-4">
                    {categories.map((category, index) => {
                        const schemaError = schemaErrors[index];
                        return (
                            <Card
                                // biome-ignore lint/suspicious/noArrayIndexKey: Backend does not provide stable IDs right now
                                key={index}
                                className="overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                            >
                                <CardHeader className="flex flex-row items-center justify-between pb-4">
                                    <CardTitle className="text-lg">
                                        Category {index + 1}:{" "}
                                        {category.name || "Unnamed"}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                removeCategory(index)
                                            }
                                            className="text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                                            title="Remove Category"
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <StyledLabel>Name *</StyledLabel>
                                            <StyledInput
                                                autoFocus={
                                                    focusedIndex === index
                                                }
                                                value={category.name}
                                                onChange={(e) =>
                                                    updateCategory(index, {
                                                        name: e.target.value,
                                                    })
                                                }
                                                placeholder="e.g. Inquiries"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <StyledLabel>
                                                Flow Type *
                                            </StyledLabel>
                                            <StyledSelect
                                                value={category.flow.name}
                                                onValueChange={(val) =>
                                                    updateFlow(index, {
                                                        name: val as
                                                            | "simple"
                                                            | "product",
                                                    })
                                                }
                                            >
                                                <StyledSelectTrigger
                                                    style={{ height: "44px" }}
                                                >
                                                    <StyledSelectValue placeholder="Select a flow type" />
                                                </StyledSelectTrigger>
                                                <StyledSelectContent>
                                                    <StyledSelectItem value="simple">
                                                        Simple
                                                    </StyledSelectItem>
                                                    <StyledSelectItem value="product">
                                                        Product
                                                    </StyledSelectItem>
                                                </StyledSelectContent>
                                            </StyledSelect>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <StyledLabel>Description *</StyledLabel>
                                        <StyledTextarea
                                            value={category.description}
                                            onChange={(e) =>
                                                updateCategory(index, {
                                                    description: e.target.value,
                                                })
                                            }
                                            placeholder="What does this category handle?"
                                            rows={2}
                                        />
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                        <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                            Flow Configuration
                                        </h4>

                                        <div className="space-y-2">
                                            <StyledLabel>
                                                Structured Response Schema (JSON
                                                Object) *
                                            </StyledLabel>
                                            <StyledTextarea
                                                value={
                                                    categoriesSchemasStr[
                                                        index
                                                    ] || ""
                                                }
                                                onChange={(e) =>
                                                    handleSchemaStrChange(
                                                        index,
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="{}"
                                                rows={6}
                                                className="font-mono text-xs max-h-128 overflow-y-auto"
                                                aria-invalid={Boolean(
                                                    schemaError,
                                                )}
                                            />
                                            {schemaError && (
                                                <p className="text-xs text-red-600 dark:text-red-400">
                                                    {schemaError}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <StyledLabel>
                                                Structured Response Prompt
                                                (Optional)
                                            </StyledLabel>
                                            <StyledTextarea
                                                value={
                                                    (category.flow
                                                        .structured_response_prompt as
                                                        | string
                                                        | undefined) || ""
                                                }
                                                onChange={(e) =>
                                                    updateFlow(index, {
                                                        structured_response_prompt:
                                                            e.target.value ||
                                                            undefined,
                                                    })
                                                }
                                                placeholder="Additional instructions for structure generation"
                                                rows={2}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <StyledLabel>
                                                Summary Prompt (Optional)
                                            </StyledLabel>
                                            <StyledTextarea
                                                value={
                                                    (category.flow
                                                        .summary_prompt as
                                                        | string
                                                        | undefined) || ""
                                                }
                                                onChange={(e) =>
                                                    updateFlow(index, {
                                                        summary_prompt:
                                                            e.target.value ||
                                                            undefined,
                                                    })
                                                }
                                                placeholder="Prompt for generating the email summary"
                                                rows={2}
                                            />
                                        </div>

                                        {category.flow.name === "product" && (
                                            <div className="space-y-2">
                                                <StyledLabel>
                                                    DB Step Prompt (Product Flow
                                                    only)
                                                </StyledLabel>
                                                <StyledTextarea
                                                    value={
                                                        (category.flow
                                                            .db_step_prompt as
                                                            | string
                                                            | undefined) || ""
                                                    }
                                                    onChange={(e) =>
                                                        updateFlow(index, {
                                                            db_step_prompt:
                                                                e.target
                                                                    .value ||
                                                                undefined,
                                                        })
                                                    }
                                                    placeholder="Prompt for the database query step"
                                                    rows={2}
                                                />
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <StyledLabel>
                                                Email Response Prompt (Optional)
                                            </StyledLabel>
                                            <StyledTextarea
                                                value={
                                                    category.flow
                                                        .email_response_prompt ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    updateFlow(index, {
                                                        email_response_prompt:
                                                            e.target.value,
                                                    })
                                                }
                                                placeholder="Instructions on how to write the email response"
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="flex justify-start">
                    <StyledButton
                        type="button"
                        onClick={addCategory}
                        label="Add Category"
                        sizeVariant="small"
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 shadow-sm"
                    />
                </div>

                <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-2xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl transition-all duration-300">
                    <StyledButton
                        type="button"
                        onClick={onReset}
                        disabled={
                            updateCategoriesMutation.isPending ||
                            (!isDirty && !hasSchemaErrors)
                        }
                        label="Discard Changes"
                        sizeVariant="small"
                        className="w-fit shadow-none bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
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
