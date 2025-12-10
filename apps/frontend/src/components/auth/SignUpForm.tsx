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
import { redirect, RedirectType } from "next/navigation";

const formSchema = z.object({
    name: z
        .string()
        .min(3, "Name must be at least 3 characters.")
        .max(100, "Name must be at most 100 characters."),
    email: z.email("Invalid email").max(254, "Email must be at most 254 characters."),
    password: z
        .string()
        .min(3, "Password must be at least 3 characters.")
        .max(100, "Password must be at most 100 characters."),
});

const SignUpForm = () => {
    const {
        control,
        handleSubmit,
        formState: { isSubmitting },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    const [signUpError, setSignUpError] = useState<string>("");

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setSignUpError("");
        const { error } = await authClient.signUp.email({
            name: data.name,
            email: data.email,
            password: data.password,
        });
        if (error) {
            if (error.message) setSignUpError(error.message);
            else setSignUpError("An error occurred");
            return;
        }
        // Setting callBackURL on signUp is not working, so we redirect to the analyse page
        redirect("/analyse", RedirectType.push);
    };

    const formId = useId();
    const nameId = useId();
    const emailId = useId();
    const passwordId = useId();

    return (
        <Card className="mx-auto w-full sm:max-w-md">
            <CardHeader>
                <CardTitle>Sign Up</CardTitle>
            </CardHeader>
            <CardContent>
                <form id={formId} onSubmit={handleSubmit(onSubmit)}>
                    <FieldGroup>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={nameId}>Name</FieldLabel>
                                    <Input
                                        {...field}
                                        id={nameId}
                                        aria-invalid={fieldState.invalid}
                                        autoComplete="name"
                                        type="text"
                                        disabled={isSubmitting}
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} />
                                    )}
                                </Field>
                            )}
                        />
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
                                        autoComplete="new-password"
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
                {signUpError && (
                    <Field orientation="horizontal">
                        <div role="alert" className="text-destructive">
                            {signUpError}
                        </div>
                    </Field>
                )}
                <Field orientation="horizontal">
                    <Button type="submit" form={formId} disabled={isSubmitting}>
                        Sign Up
                    </Button>
                </Field>
                <Field orientation="horizontal">
                    Already have an account?
                    <Link href="/auth/login" className="font-medium">
                        Login
                    </Link>
                </Field>
            </CardFooter>
        </Card>
    );
};

export default SignUpForm;
