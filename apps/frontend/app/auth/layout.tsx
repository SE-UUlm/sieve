import type React from "react";

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
    return (
        <main className="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
            {children}
        </main>
    );
};

export default AuthLayout;
