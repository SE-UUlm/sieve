"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { SettingsSection } from "@/components/composites/views/settings/settings-section";
import { StyledButton } from "@/components/ui/styled-button";
import { StyledInput } from "@/components/ui/styled-input";
import { StyledLabel } from "@/components/ui/styled-label";
import { authClient } from "@/lib/auth-client";
import { showPersistentErrorToast, showSuccessToast } from "@/lib/toast";

const formSchema = z
    .object({
        currentPassword: z
            .string()
            .min(8, "Current password must be at least 8 characters."),
        newPassword: z
            .string()
            .min(8, "New password must be at least 8 characters."),
        confirmPassword: z
            .string()
            .min(8, "Confirm password must be at least 8 characters."),
    })
    .refine((values) => values.newPassword === values.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
    });

type FormValues = z.infer<typeof formSchema>;

/**
 * Resolves a user-facing password update message from Better Auth errors.
 *
 * @param error Unknown error value returned by the auth client.
 * @returns A user-facing message.
 */
function getPasswordUpdateErrorMessage(error: unknown): string {
    if (!error || typeof error !== "object") {
        return "There was an issue with the server. Please try again later.";
    }

    const status =
        "status" in error && typeof error.status === "number"
            ? error.status
            : undefined;

    if (status === 400 || status === 401) {
        return "Your current password is incorrect.";
    }

    return "There was an issue with the server. Please try again later.";
}

export function UserSecuritySection() {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (values: FormValues) => {
        const { error } = await authClient.changePassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
            revokeOtherSessions: false,
        });

        if (error) {
            console.error("[settings] Failed to update password", error);
            showPersistentErrorToast({
                title: "Password Update Failed",
                description: getPasswordUpdateErrorMessage(error),
            });
            return;
        }

        form.reset();
        showSuccessToast({
            title: "Password Updated",
            description: "Your password was updated successfully.",
        });
    };

    return (
        <SettingsSection
            title="Security"
            description="Update your account password."
        >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <StyledLabel>Current Password</StyledLabel>
                        <Controller
                            name="currentPassword"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-1">
                                    <StyledInput
                                        {...field}
                                        type="password"
                                        placeholder="Current password"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.error && (
                                        <p className="text-xs text-red-500">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <StyledLabel>New Password</StyledLabel>
                        <Controller
                            name="newPassword"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-1">
                                    <StyledInput
                                        {...field}
                                        type="password"
                                        placeholder="New password"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.error && (
                                        <p className="text-xs text-red-500">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <StyledLabel>Confirm Password</StyledLabel>
                        <Controller
                            name="confirmPassword"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-1">
                                    <StyledInput
                                        {...field}
                                        type="password"
                                        placeholder="Confirm password"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.error && (
                                        <p className="text-xs text-red-500">
                                            {fieldState.error.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end">
                    <div className="w-full max-w-xs">
                        <StyledButton
                            type="submit"
                            isLoading={form.formState.isSubmitting}
                            disabled={!form.formState.isValid}
                            label="Update Password"
                            loadingLabel="Updating..."
                        />
                    </div>
                </div>
            </form>
        </SettingsSection>
    );
}
