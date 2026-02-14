"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { SettingsSection } from "@/components/composites/views/settings/settings-section";
import { StyledButton } from "@/components/ui/styled-button";
import { StyledInput } from "@/components/ui/styled-input";
import { StyledLabel } from "@/components/ui/styled-label";
import { authClient } from "@/lib/auth-client";
import { showPersistentErrorToast, showSuccessToast } from "@/lib/toast";

const formSchema = z.object({
    name: z
        .string()
        .min(3, "Name must be at least 3 characters.")
        .max(100, "Name must be at most 100 characters."),
    email: z
        .email("Invalid email")
        .max(254, "Email must be at most 254 characters."),
});

type FormValues = z.infer<typeof formSchema>;

export function UserProfileSection() {
    const { data: session, isPending } = authClient.useSession();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
        },
    });

    useEffect(() => {
        if (!session?.user) return;
        form.reset({
            name: session.user.name ?? "",
            email: session.user.email ?? "",
        });
    }, [session?.user, form]);

    const initialValues = useMemo(
        () => ({
            name: session?.user?.name ?? "",
            email: session?.user?.email ?? "",
        }),
        [session?.user?.name, session?.user?.email],
    );

    const onSubmit = async (values: FormValues) => {
        const updates: string[] = [];

        if (values.name !== initialValues.name) {
            const { error } = await authClient.updateUser({
                name: values.name,
            });
            if (error) {
                console.error("[settings] Failed to update name", error);
                showPersistentErrorToast({
                    title: "Profile Update Failed",
                    description:
                        "There was an issue with the server. Please try again later.",
                });
                return;
            }
            updates.push("Name updated");
        }

        if (values.email !== initialValues.email) {
            const { error } = await authClient.changeEmail({
                newEmail: values.email,
                callbackURL: `${window.location.origin}/settings`,
            });
            if (error) {
                console.error("[settings] Failed to update email", error);
                showPersistentErrorToast({
                    title: "Profile Update Failed",
                    description:
                        "There was an issue with the server. Please try again later.",
                });
                return;
            }
            updates.push("Email update requested (verify via email)");
        }

        if (updates.length === 0) {
            showSuccessToast({
                title: "No Changes Detected",
                description: "There are no profile updates to save.",
            });
            return;
        }

        showSuccessToast({
            title: "Profile Updated",
            description: updates.join(" · "),
        });
    };

    const hasChanges =
        form.watch("name") !== initialValues.name ||
        form.watch("email") !== initialValues.email;

    return (
        <SettingsSection
            title="Profile"
            description="Update your name and email for this account."
        >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <StyledLabel>Name</StyledLabel>
                        <Controller
                            name="name"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-1">
                                    <StyledInput
                                        {...field}
                                        placeholder="Your name"
                                        disabled={isPending}
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
                        <StyledLabel>Email</StyledLabel>
                        <Controller
                            name="email"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-1">
                                    <StyledInput
                                        {...field}
                                        placeholder="you@company.com"
                                        disabled={isPending}
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
                            disabled={!form.formState.isValid || !hasChanges}
                            label="Save changes"
                            loadingLabel="Saving..."
                        />
                    </div>
                </div>
            </form>
        </SettingsSection>
    );
}
