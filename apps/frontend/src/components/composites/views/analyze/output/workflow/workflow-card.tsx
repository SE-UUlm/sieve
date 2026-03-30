import type { ReactNode } from "react";

type WorkflowCardProps = {
    isVisible: boolean;
    children: ReactNode;
    className?: string;
    delay?: number;
};

export function WorkflowCard({
    isVisible,
    children,
    className = "",
    delay = 0,
}: WorkflowCardProps) {
    return (
        <div
            className={`group relative w-full rounded-xl border p-4 shadow-sm transition-all duration-300 max-w-4xl animate-in fade-in slide-in-from-bottom-4 fill-mode-both ${
                isVisible
                    ? "translate-y-0 border-slate-200 bg-white opacity-100 dark:border-slate-700 dark:bg-slate-800/50"
                    : "translate-y-4 border-slate-100 bg-slate-50 opacity-30 dark:border-slate-800 dark:bg-slate-900"
            } ${className}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}
