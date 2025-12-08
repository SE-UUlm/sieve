"use client";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as z from "zod";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CSSProperties, useEffect, useId, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { emailControllerSubmitEmail, jobControllerGetJobResult } from "@/lib/client";
import { redirect, RedirectType } from "next/navigation";

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

    async function onSubmit(data: z.infer<typeof formSchema>) {
        setEmailResult("");
        toast("Email submitted", {
            position: "bottom-right",
            classNames: {
                content: "flex flex-col gap-2",
            },
            style: {
                "--border-radius": "calc(var(--radius)  + 4px)",
            } as CSSProperties,
        });

        const result = await emailControllerSubmitEmail({
            body: data.emailContent,
        });

        if (result.status === 201) {
            setEmailResult(result.data.data);
        } else {
            toast("Error submitting email", {
                description: JSON.stringify(result, null, 2),
                position: "bottom-right",
                classNames: {
                    content: "flex flex-col gap-2",
                },
                style: {
                    "--border-radius": "calc(var(--radius)  + 4px)",
                } as CSSProperties,
            });
        }
    }

    const { data: session, isPending, error } = authClient.useSession();

    if (!isPending && !error && !session?.user) redirect("/auth/login", RedirectType.push);

    return (
        <main className="mx-auto flex max-w-6xl flex-col gap-12 p-4 lg:p-24">
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
                                />
                                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                            </Field>
                        )}
                    />
                </FieldGroup>
                <Button type="submit" size="lg">
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
