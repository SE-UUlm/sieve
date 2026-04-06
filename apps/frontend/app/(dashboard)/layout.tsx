"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect } from "react";
import { Sidebar } from "@/components/composites/sidebar/sidebar";
import { DashboardLoadingView } from "@/components/composites/views/dashboard-loading-view";

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

    // Auth Protection
    useEffect(() => {
        if (!isPending && !session) {
            router.push("/auth/login");
        }
    }, [session, isPending, router]);

    if (isPending) return <DashboardLoadingView />;
    if (!session) return null;

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans transition-colors duration-300 dark:bg-slate-950 dark:text-slate-200">
            <Sidebar onLogout={logout} />

            <main className="relative flex h-full w-full overflow-hidden">
                {children}
            </main>
        </div>
    );
}
