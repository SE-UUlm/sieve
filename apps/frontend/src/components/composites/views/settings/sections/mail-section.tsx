"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import z from "zod";
import { SettingsSection } from "@/components/composites/views/settings/settings-section";
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
import { showPersistentErrorToast } from "@/lib/toast";

const formSchema = z.object({
    imapHost: z
        .string()
        .min(1, "IMAP server is required.")
        .max(255, "IMAP server must be at most 255 characters."),
    imapPort: z
        .coerce
        .number()
        .int("Port must be a whole number.")
        .min(1, "Port must be between 1 and 65535.")
        .max(65535, "Port must be between 1 and 65535."),
    username: z
        .string()
        .min(1, "Username is required.")
        .max(255, "Username must be at most 255 characters."),
    password: z.string().min(1, "Password is required."),
    security: z.enum(["ssl", "starttls", "none"]),
    mailbox: z
        .string()
        .min(1, "Mailbox is required.")
        .max(255, "Mailbox must be at most 255 characters."),
});

type FormValues = z.infer<typeof formSchema>;

export function MailSection() {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            imapHost: "",
            imapPort: 993,
            username: "",
            password: "",
            security: "ssl",
            mailbox: "INBOX",
        },
    });

    const onSubmit = (_values: FormValues) => {
        showPersistentErrorToast({
            title: "IMAP Linking Not Connected",
            description:
                "The IMAP settings UI is ready, but backend integration is not wired up yet.",
        });
    };

    return (
        <SettingsSection
            title="Mail"
            description="Connect an IMAP mailbox so incoming emails can be imported into Sieve."
        >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <StyledLabel>IMAP Server</StyledLabel>
                        <Controller
                            name="imapHost"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-1">
                                    <StyledInput
                                        {...field}
                                        placeholder="imap.example.com"
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
                        <StyledLabel>Port</StyledLabel>
                        <Controller
                            name="imapPort"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-1">
                                    <StyledInput
                                        {...field}
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="993"
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
                        <StyledLabel>Username</StyledLabel>
                        <Controller
                            name="username"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-1">
                                    <StyledInput
                                        {...field}
                                        placeholder="you@example.com"
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
                        <StyledLabel>Password</StyledLabel>
                        <Controller
                            name="password"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-1">
                                    <StyledInput
                                        {...field}
                                        type="password"
                                        placeholder="App password"
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
                        <StyledLabel>Connection Security</StyledLabel>
                        <Controller
                            name="security"
                            control={form.control}
                            render={({ field }) => (
                                <StyledSelect
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <StyledSelectTrigger>
                                        <StyledSelectValue placeholder="Select security" />
                                    </StyledSelectTrigger>
                                    <StyledSelectContent>
                                        <StyledSelectItem value="ssl">
                                            SSL/TLS (recommended)
                                        </StyledSelectItem>
                                        <StyledSelectItem value="starttls">
                                            STARTTLS
                                        </StyledSelectItem>
                                        <StyledSelectItem value="none">
                                            None
                                        </StyledSelectItem>
                                    </StyledSelectContent>
                                </StyledSelect>
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <StyledLabel>Mailbox</StyledLabel>
                        <Controller
                            name="mailbox"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-1">
                                    <StyledInput
                                        {...field}
                                        placeholder="INBOX"
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

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        IMAP linking is UI-only for now. Backend integration
                        will be added next.
                    </p>
                    <div className="w-full max-w-xs">
                        <StyledButton
                            type="submit"
                            isLoading={form.formState.isSubmitting}
                            disabled={!form.formState.isValid}
                            label="Save mail settings"
                            loadingLabel="Saving..."
                        />
                    </div>
                </div>
            </form>
        </SettingsSection>
    );
}
