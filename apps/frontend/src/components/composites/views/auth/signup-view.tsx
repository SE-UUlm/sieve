"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type SubmitEventHandler, useEffect, useState } from "react";
import { LogoWithLabel } from "@/components/composites/logo-with-label";
import { CenteredFormViewSkeleton } from "@/components/composites/skeletons";
import { ThemeToggleButton } from "@/components/composites/theme/theme-toggle-button";
import { StyledButton } from "@/components/ui/styled-button";
import { StyledInput } from "@/components/ui/styled-input";
import { StyledLabel } from "@/components/ui/styled-label";
import { authClient } from "@/lib/auth-client";
import { showPersistentErrorToast } from "@/lib/toast";

export function SignupView() {
    const { data: session, isPending: isSessionPending } =
        authClient.useSession();
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmittedAuth, setHasSubmittedAuth] = useState(false);

    useEffect(() => {
        if (!isSessionPending && session && !hasSubmittedAuth) {
            router.replace("/analyze");
        }
    }, [hasSubmittedAuth, isSessionPending, router, session]);

    const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();

        if (name.length < 3) {
            showPersistentErrorToast({
                title: "Cannot Sign Up",
                description: "Name must be at least 3 characters.",
            });
            return;
        }

        if (password.length < 3) {
            showPersistentErrorToast({
                title: "Cannot Sign Up",
                description: "Password must be at least 3 characters.",
            });
            return;
        }

        setIsSubmitting(true);
        setHasSubmittedAuth(true);

        try {
            const { error } = await authClient.signUp.email({
                name,
                email,
                password,
            });

            if (error) {
                showPersistentErrorToast({
                    title: "Sign Up Failed",
                    description: error.message || "An error occurred",
                });
                setHasSubmittedAuth(false);
                return;
            }

            router.push("/analyze");
        } catch (error) {
            console.error("[auth] Sign up failed with unexpected error", error);
            showPersistentErrorToast({
                title: "Sign Up Failed",
                description:
                    "There was an issue with the server. Please try again later.",
            });
            setHasSubmittedAuth(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSessionPending) {
        return <CenteredFormViewSkeleton fieldCount={3} />;
    }

    if (session && !hasSubmittedAuth) {
        return <CenteredFormViewSkeleton fieldCount={3} />;
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 text-slate-900 transition-colors duration-300 dark:text-slate-200">
            <div className="absolute top-6 right-6">
                <ThemeToggleButton className="hover:text-blue-600 dark:hover:text-yellow-400" />
            </div>

            <div className="w-full max-w-md space-y-8">
                <LogoWithLabel />

                <div className="space-y-2 text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Create your account
                    </h1>
                    <p className="font-light text-slate-500 dark:text-slate-400">
                        Enter your details below to sign up
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <StyledLabel htmlFor="name">Name</StyledLabel>
                            <StyledInput
                                id="name"
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Your name"
                                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-600"
                                autoComplete="name"
                                required
                                maxLength={100}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <StyledLabel htmlFor="email">Email</StyledLabel>
                            <StyledInput
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="Email"
                                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-600"
                                autoComplete="email"
                                required
                                maxLength={254}
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <StyledLabel htmlFor="password">
                                Password
                            </StyledLabel>
                            <StyledInput
                                id="password"
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="••••••••"
                                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:placeholder-slate-600"
                                autoComplete="new-password"
                                required
                                maxLength={100}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <StyledButton
                        type="submit"
                        isLoading={isSubmitting}
                        label="Sign Up"
                        loadingLabel="Signing up..."
                        sizeVariant="medium"
                        disabled={isSubmitting}
                    />
                </form>

                <div className="text-center text-sm text-slate-500 dark:text-slate-500">
                    Already have an account?{" "}
                    <Link
                        href="/auth/login"
                        className="font-medium text-slate-900 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-white"
                    >
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default SignupView;
