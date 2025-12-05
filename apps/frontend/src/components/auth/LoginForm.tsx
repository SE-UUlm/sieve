"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CSSProperties, useId } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

const formSchema = z.object({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters.")
        .max(32, "Username must be at most 32 characters."),
    password: z
        .string()
        .min(3, "Password must be at least 3 characters.")
        .max(100, "Password must be at most 100 characters."),
});

const LoginForm = () => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    async function onSubmit(data: z.infer<typeof formSchema>) {
        const { data: loginData, error } = await authClient.signIn.email({
            email: data.username,
            password: data.password,
        });
        toast("Login Result:", {
            description:
                "data: " +
                JSON.stringify(loginData, null, 2) +
                "\nerror: " +
                JSON.stringify(error, null, 2),
            position: "bottom-right",
            classNames: {
                content: "flex flex-col gap-2",
            },
            style: {
                "--border-radius": "calc(var(--radius)  + 4px)",
            } as CSSProperties,
        });
    }

    const formId = useId();
    const usernameId = useId();
    const passwordId = useId();

    return (
        <Card className="mx-auto w-full sm:max-w-md">
            <CardHeader>
                <CardTitle>Login</CardTitle>
            </CardHeader>
            <CardContent>
                <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup>
                        <Controller
                            name="username"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={usernameId}>Username</FieldLabel>
                                    <Input
                                        {...field}
                                        id={usernameId}
                                        aria-invalid={fieldState.invalid}
                                        autoComplete="username"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />
                        <Controller
                            name="password"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
                                    <Input
                                        {...field}
                                        type="password"
                                        id={passwordId}
                                        aria-invalid={fieldState.invalid}
                                        autoComplete="current-password"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </form>
            </CardContent>
            <CardFooter className="flex-col gap-4">
                <Field orientation="horizontal">
                    <Button type="submit" form={formId}>
                        Login
                    </Button>
                </Field>
                <Field orientation="horizontal">
                    Don&apos;t have an account?
                    <Link href="/auth/signup" className="font-medium">
                        Sign up
                    </Link>
                </Field>
            </CardFooter>
        </Card>
    );
};

export default LoginForm;
