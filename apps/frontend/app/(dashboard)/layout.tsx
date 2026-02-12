"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import type React from "react";
import { useEffect } from "react";
import { Sidebar } from "@/components/composites/sidebar/sidebar";
import useLogout from "@/hooks/useLogout";
import { authClient } from "@/lib/auth-client";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();
    const { logout } = useLogout();

    const { theme, setTheme, resolvedTheme } = useTheme();
    const isDark = (resolvedTheme ?? theme) === "dark";

    // Auth Protection
    useEffect(() => {
        if (!isPending && !session) {
            router.push("/auth/login");
        }
    }, [session, isPending, router]);

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark");
    };

    if (isPending || !session) return null;

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans transition-colors duration-300 dark:bg-slate-950 dark:text-slate-200">
            <Sidebar
                onToggleTheme={toggleTheme}
                onLogout={logout}
                isDark={isDark}
            />

            <main className="relative flex h-full w-full overflow-hidden">
                {children}
            </main>
        </div>
    );
}
