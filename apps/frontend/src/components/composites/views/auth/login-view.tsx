"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type SubmitEventHandler, useState } from "react";
import AlreadyLoggedIn from "@/components/composites/auth/already-logged-in";
import SessionLoading from "@/components/composites/auth/session-loading";
import { LogoWithLabel } from "@/components/composites/logo-with-label";
import { ThemeToggleButton } from "@/components/composites/theme/theme-toggle-button";
import { StyledButton } from "@/components/ui/styled-button";
import { StyledInput } from "@/components/ui/styled-input";
import { StyledLabel } from "@/components/ui/styled-label";
import { authClient } from "@/lib/auth-client";
import { showPersistentErrorToast } from "@/lib/toast";

export function LoginView() {
    const { data: session, isPending: isSessionPending } =
        authClient.useSession();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmittedAuth, setHasSubmittedAuth] = useState(false);

    const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setHasSubmittedAuth(true);

        try {
            const { error } = await authClient.signIn.email({
                email,
                password,
                callbackURL: "/analyze",
            });

            if (error) {
                showPersistentErrorToast({
                    title: "Login Failed",
                    description: error.message || "An error occurred",
                });
                setHasSubmittedAuth(false);
                return;
            }

            router.push("/analyze");
        } catch (error) {
            console.error("[auth] Login failed with unexpected error", error);
            showPersistentErrorToast({
                title: "Login Failed",
                description:
                    "There was an issue with the server. Please try again later.",
            });
            setHasSubmittedAuth(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSessionPending) {
        return <SessionLoading />;
    }

    if (session && !hasSubmittedAuth) {
        return <AlreadyLoggedIn />;
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
                        Login to your account
                    </h1>
                    <p className="font-light text-slate-500 dark:text-slate-400">
                        Enter your email below to login to your account
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-4">
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
                                autoComplete="current-password"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <StyledButton
                        type="submit"
                        isLoading={isSubmitting}
                        label="Login"
                        loadingLabel="Logging in..."
                        sizeVariant="medium"
                        disabled={isSubmitting}
                    />
                </form>

                <div className="text-center text-sm text-slate-500 dark:text-slate-500">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/auth/signup"
                        className="font-medium text-slate-900 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-white"
                    >
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default LoginView;
