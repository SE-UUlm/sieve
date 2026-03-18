import type React from "react";
import { cn } from "@/lib/utils/shadcn-helper";

type SkeletonCardProps = {
    children: React.ReactNode;
    className?: string;
};

export function SkeletonCard({ children, className }: SkeletonCardProps) {
    return (
        <div
            className={cn(
                "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60",
                className,
            )}
        >
            {children}
        </div>
    );
}
