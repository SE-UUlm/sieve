"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useId, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

const formSchema = z.object({
    email: z
        .string()
        .min(3, "Email must be at least 3 characters.")
        .max(64, "Email must be at most 64 characters."),
    password: z
        .string()
        .min(3, "Password must be at least 3 characters.")
        .max(100, "Password must be at most 100 characters."),
});

const LoginForm = () => {
    const {
        control,
        handleSubmit,
        formState: { isSubmitting },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const [loginError, setLoginError] = useState<string>("");

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setLoginError("");
        const { error } = await authClient.signIn.email({
            email: data.email,
            password: data.password,
            callbackURL: "/analyse",
        });
        if (error) {
            if (error.message) setLoginError(error.message);
            else setLoginError("An error occurred");
        }
    };

    const formId = useId();
    const emailId = useId();
    const passwordId = useId();

    return (
        <Card className="mx-auto w-full sm:max-w-md">
            <CardHeader>
                <CardTitle>Login</CardTitle>
            </CardHeader>
            <CardContent>
                <form id={formId} onSubmit={handleSubmit(onSubmit)}>
                    <FieldGroup>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={emailId}>Email</FieldLabel>
                                    <Input
                                        {...field}
                                        id={emailId}
                                        aria-invalid={fieldState.invalid}
                                        autoComplete="email"
                                        type="email"
                                        disabled={isSubmitting}
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />
                        <Controller
                            name="password"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
                                    <Input
                                        {...field}
                                        type="password"
                                        id={passwordId}
                                        aria-invalid={fieldState.invalid}
                                        autoComplete="current-password"
                                        disabled={isSubmitting}
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
                {loginError && (
                    <Field orientation="horizontal">
                        <div role="alert" className="text-destructive">
                            {loginError}
                        </div>
                    </Field>
                )}
                <Field orientation="horizontal">
                    <Button type="submit" form={formId} disabled={isSubmitting}>
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
