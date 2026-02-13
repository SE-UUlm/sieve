import type { ReactNode } from "react";
import { cn } from "@/lib/utils/shadcn-helper";

type ResultCardProps = {
    children: ReactNode;
    className?: string;
};

/**
 * Shared card shell used by result sections.
 */
export function ResultCard({ children, className }: ResultCardProps) {
    return (
        <div
            className={cn(
                "group relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80",
                className,
            )}
        >
            {children}
        </div>
    );
}
