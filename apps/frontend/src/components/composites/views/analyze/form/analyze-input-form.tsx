"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { StyledButton } from "@/components/ui/styled-button";
import { StyledInput } from "@/components/ui/styled-input";
import { StyledTextarea } from "@/components/ui/styled-textarea";
import type { AnalyzeFormValues } from "./analyze-form-schema";

type AnalyzeInputFormProps = {
    form: UseFormReturn<AnalyzeFormValues>;
    isPending: boolean;
    onSubmit: (values: AnalyzeFormValues) => void;
};

/**
 * Form component for collecting the email subject and body before analysis.
 */
export function AnalyzeInputForm({
    form,
    isPending,
    onSubmit,
}: AnalyzeInputFormProps) {
    return (
        <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col gap-6"
        >
            <div className="space-y-2">
                <Controller
                    name="subject"
                    control={form.control}
                    render={({ field }) => (
                        <StyledInput
                            {...field}
                            placeholder="Subject"
                            disabled={isPending}
                        />
                    )}
                />
                {form.formState.errors.subject && (
                    <p className="text-xs font-medium text-red-500">
                        {form.formState.errors.subject.message}
                    </p>
                )}
            </div>

            <div className="relative min-h-50 flex-1">
                <Controller
                    name="emailContent"
                    control={form.control}
                    render={({ field }) => (
                        <StyledTextarea
                            {...field}
                            placeholder="Dear Support, I am writing regarding..."
                            className="h-full w-full"
                            disabled={isPending}
                        />
                    )}
                />
                {form.formState.errors.emailContent && (
                    <p className="absolute bottom-4 left-6 text-xs font-medium text-red-500">
                        {form.formState.errors.emailContent.message}
                    </p>
                )}
            </div>

            <StyledButton
                type="submit"
                isLoading={isPending}
                disabled={!form.formState.isValid}
                label="Analyze Mail"
                loadingLabel="Analyzing..."
            />
        </form>
    );
}
