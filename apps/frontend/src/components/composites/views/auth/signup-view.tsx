"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AlreadyLoggedIn from "@/components/composites/auth/already-logged-in";
import { LogoWithLabel } from "@/components/composites/logo-with-label";
import { ThemeToggleButton } from "@/components/composites/theme/theme-toggle-button";
import { authClient } from "@/lib/auth-client";

export function SignupView() {
    const { data: session, isPending: isSessionPending } =
        authClient.useSession();
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [signupError, setSignupError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSignupError("");

        if (name.length < 3) {
            setSignupError("Name must be at least 3 characters.");
            return;
        }

        if (password.length < 3) {
            setSignupError("Password must be at least 3 characters.");
            return;
        }

        setIsSubmitting(true);

        const { error } = await authClient.signUp.email({
            name,
            email,
            password,
        });

        if (error) {
            setSignupError(error.message || "An error occurred");
            setIsSubmitting(false);
            return;
        }

        router.push("/analyze");
    };

    if (isSessionPending) {
        return null;
    }

    if (session) {
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
                        Create your account
                    </h1>
                    <p className="font-light text-slate-500 dark:text-slate-400">
                        Enter your details below to sign up
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="name"
                                className="text-sm font-medium text-slate-600 dark:text-slate-300"
                            >
                                Name
                            </label>
                            <input
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
                            <label
                                htmlFor="email"
                                className="text-sm font-medium text-slate-600 dark:text-slate-300"
                            >
                                Email
                            </label>
                            <input
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
                            <label
                                htmlFor="password"
                                className="text-sm font-medium text-slate-600 dark:text-slate-300"
                            >
                                Password
                            </label>
                            <input
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

                    {signupError ? (
                        <p
                            role="alert"
                            className="text-sm text-red-600 dark:text-red-400"
                        >
                            {signupError}
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white shadow-lg shadow-slate-200/10 transition-colors duration-200 ease-in-out hover:bg-black disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Signing up..." : "Sign Up"}
                    </button>
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
