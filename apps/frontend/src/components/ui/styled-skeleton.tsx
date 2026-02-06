import type React from "react";
import { Skeleton } from "@/components/primitives/skeleton";
import { cn } from "@/lib/utils/shadcn-helper";

export function StyledSkeleton({
    className,
    ...props
}: React.ComponentProps<typeof Skeleton>) {
    return (
        <Skeleton
            className={cn("rounded bg-slate-200 dark:bg-slate-800", className)}
            {...props}
        />
    );
}
