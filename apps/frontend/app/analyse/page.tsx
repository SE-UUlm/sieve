"use client";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useEmailControllerSubmitEmail } from "@/lib/client";
import { redirect, RedirectType } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

const formSchema = z.object({
    emailContent: z.string().min(1, "Email content must be at least 1 character."),
});

const AnalysePage = () => {
    const [emailResult, setEmailResult] = useState<string>("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            emailContent: "",
        },
    });

    const { mutate, isPending } = useEmailControllerSubmitEmail({
        mutation: {
            onMutate: () => {
                setEmailResult("");
            },
            onSuccess: (data) => {
                // TODO it is probably better to define our own use Hook and treat the errors correctly (or maby configure it in orval config if possible)
                if (data.status === 201) setEmailResult(data.data.data);
                else setEmailResult("Failed to analyze email. Please try again.");
            },
            onError: () => {
                setEmailResult("Failed to analyze email. Please try again.");
            },
        },
    });

    const {
        data: session,
        isPending: isSessionPending,
        error: sessionError,
    } = authClient.useSession();

    if (!isSessionPending && !sessionError && !session?.user)
        redirect("/auth/login", RedirectType.push);

    return (
        <main className="mx-auto flex max-w-6xl flex-col gap-12 p-4 lg:p-24">
            <form
                onSubmit={form.handleSubmit((data) =>
                    mutate({ data: { body: data.emailContent } }),
                )}
                className="flex flex-col gap-4"
            >
                <h1>Analyse Email</h1>
                <FieldGroup>
                    <Controller
                        name="emailContent"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <Textarea
                                    placeholder="Paste your email here"
                                    {...field}
                                    aria-invalid={fieldState.invalid}
                                    disabled={isPending}
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                </FieldGroup>
                <Button type="submit" size="lg" disabled={isPending}>
                    {isPending && <Spinner />}
                    Analyse
                </Button>
            </form>
            <div className="flex flex-col gap-4">
                <h2>Result</h2>
                <Textarea readOnly value={emailResult} />
            </div>
        </main>
    );
};
export default AnalysePage;
