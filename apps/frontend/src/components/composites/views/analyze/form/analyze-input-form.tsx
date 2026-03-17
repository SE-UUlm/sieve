"use client";

import {
    Controller,
    type SubmitErrorHandler,
    type UseFormReturn,
} from "react-hook-form";
import { StyledButton } from "@/components/ui/styled-button";
import { StyledInput } from "@/components/ui/styled-input";
import { StyledTextarea } from "@/components/ui/styled-textarea";
import type { AnalyzeFormValues } from "./analyze-form-schema";

type AnalyzeInputFormProps = {
    form: UseFormReturn<AnalyzeFormValues>;
    isPending: boolean;
    onSubmitAction: (values: AnalyzeFormValues) => void;
    onInvalidSubmitAction: SubmitErrorHandler<AnalyzeFormValues>;
};

/**
 * Form component for collecting the email subject and body before analysis.
 */
export function AnalyzeInputForm({
    form,
    isPending,
    onSubmitAction,
    onInvalidSubmitAction,
}: AnalyzeInputFormProps) {
    return (
        <form
            onSubmit={form.handleSubmit(onSubmitAction, onInvalidSubmitAction)}
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
            </div>

            <div className="min-h-50 flex-1">
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
            </div>

            <StyledButton
                type="submit"
                isLoading={isPending}
                disabled={!form.formState.isValid}
                label="Analyze Mail"
                loadingLabel="Analyzing..."
                sizeVariant="large"
            />
        </form>
    );
}
