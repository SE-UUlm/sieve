import type React from "react";
import { Skeleton } from "@/components/primitives/skeleton";
import { cn } from "@/lib/utils/shadcn-helper";

export function StyledSkeleton({
    className,
    ...props
}: React.ComponentProps<typeof Skeleton>) {
    return (
        <Skeleton
            className={cn(
                "rounded-md bg-slate-200/90 dark:bg-slate-800/80",
                className,
            )}
            {...props}
        />
    );
}
