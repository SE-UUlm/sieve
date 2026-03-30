"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { type SubmitErrorHandler, useForm } from "react-hook-form";
import {
    type AnalyzeFormValues,
    analyzeFormSchema,
} from "@/components/composites/views/analyze/form/analyze-form-schema";
import { AnalyzeInputForm } from "@/components/composites/views/analyze/form/analyze-input-form";
import type { AnalysisResult } from "@/components/composites/views/analyze/model/analysis-result";
import { OutputPanel } from "@/components/composites/views/analyze/output/output-panel";
import { SplitView } from "@/components/composites/views/split-view/split-view";
import { SplitViewPane } from "@/components/composites/views/split-view/split-view-pane";
import { useEmailControllerSubmitEmail } from "@/lib/client";
import { showPersistentErrorToast } from "@/lib/toast";

/**
 * Analyze page container that orchestrates authentication, API calls, and view state.
 */
export function AnalyzeView() {
    // Local UI State
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [currentStep, setCurrentStep] = useState(0);

    const form = useForm<AnalyzeFormValues>({
        resolver: zodResolver(analyzeFormSchema),
        defaultValues: {
            subject: "",
            emailContent: "",
        },
    });

    const { mutate, isPending } = useEmailControllerSubmitEmail({
        mutation: {
            onMutate: () => {
                setResult(null);
                setCurrentStep(0);
            },
            onSuccess: (response) => {
                if (response.status === 201) {
                    setResult(response.data.data);
                    setCurrentStep(4);
                    return;
                }

                setCurrentStep(0);
                showPersistentErrorToast(
                    getAnalyzeErrorToastFromStatus(response.status),
                );
            },
            onError: (error) => {
                console.error("[analyze] Email analysis request failed", error);
                setCurrentStep(0);
                const toastError = getAnalyzeErrorToastFromError(error);
                showPersistentErrorToast(toastError);
            },
        },
    });

    /**
     * Submits the email content to the backend for analysis.
     */
    const onSubmit = (values: AnalyzeFormValues) => {
        setCurrentStep(0);
        const normalizedSubject = values.subject.trim();

        mutate({
            data: {
                subject:
                    normalizedSubject.length > 0
                        ? normalizedSubject
                        : undefined,
                body: values.emailContent,
            },
        });
    };

    /**
     * Handles form validation errors shown during submit.
     */
    const onInvalidSubmit: SubmitErrorHandler<AnalyzeFormValues> = (errors) => {
        const firstErrorMessage =
            Object.values(errors)[0]?.message ??
            "Please check your input and try again.";

        showPersistentErrorToast({
            title: "Cannot Submit Analysis",
            description: String(firstErrorMessage),
        });
    };

    return (
        <SplitView resizable>
            <SplitViewPane variant="primary" className="flex flex-col">
                <div className="mx-auto flex h-full w-full flex-col">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Analyze Single Mail
                        </h2>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            Add a subject and paste an email below to extract
                            structured data.
                        </p>
                    </div>

                    <AnalyzeInputForm
                        form={form}
                        isPending={isPending}
                        onSubmitAction={onSubmit}
                        onInvalidSubmitAction={onInvalidSubmit}
                    />
                </div>
            </SplitViewPane>
            <SplitViewPane variant="secondary" isScrollable>
                <OutputPanel
                    result={result}
                    isAnalyzing={isPending}
                    currentStep={currentStep}
                />
            </SplitViewPane>
        </SplitView>
    );
}

type AnalyzeErrorToast = {
    title: string;
    description: string;
};

/**
 * Maps API status codes to a user-facing analyze error toast.
 *
 * @param status HTTP status code returned by the analyze endpoint.
 * @returns Title and description for the persistent error toast.
 */
function getAnalyzeErrorToastFromStatus(status: number): AnalyzeErrorToast {
    if (status === 503) {
        return {
            title: "Analysis Unavailable",
            description:
                "Email analysis is not configured yet. Please contact an admin.",
        };
    }

    if (status === 423) {
        return {
            title: "Analysis Disabled",
            description:
                "Email analysis is currently disabled by an admin. Please try again later.",
        };
    }

    return {
        title: "Email Analysis Failed",
        description:
            "There was an issue with the server. Please try again later.",
    };
}

/**
 * Maps unexpected client/network failures to a user-facing analyze error toast.
 *
 * @param error Unknown error returned by the mutation.
 * @returns Title and description for the persistent error toast.
 */
function getAnalyzeErrorToastFromError(error: unknown): AnalyzeErrorToast {
    if (!error || typeof error !== "object") {
        return {
            title: "Email Analysis Failed",
            description:
                "There was an issue with the server. Please try again later.",
        };
    }

    const status =
        "status" in error && typeof error.status === "number"
            ? error.status
            : undefined;

    if (status !== undefined) {
        return getAnalyzeErrorToastFromStatus(status);
    }

    return getAnalyzeErrorToastFromStatus(500);
}
