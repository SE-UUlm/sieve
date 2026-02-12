import type React from "react";
import { cn } from "@/lib/utils/shadcn-helper";

type SplitViewProps = {
    children: React.ReactNode;
    className?: string;
};

export function SplitView({ children, className = "" }: SplitViewProps) {
    return (
        <div
            className={cn(
                "flex h-full w-full flex-col overflow-hidden transition-colors duration-300 md:flex-row",
                className,
            )}
        >
            {children}
        </div>
    );
}
