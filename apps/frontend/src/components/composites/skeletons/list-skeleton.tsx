import type React from "react";
import { cn } from "@/lib/utils/shadcn-helper";
import { ListItemSkeleton } from "./list-item-skeleton";

type ListSkeletonProps = {
    itemCount?: number;
    className?: string;
    renderItem?: (index: number) => React.ReactNode;
};

export function ListSkeleton({
    itemCount = 3,
    className,
    renderItem,
}: ListSkeletonProps) {
    return (
        <div className={cn("space-y-3", className)}>
            {Array.from({ length: itemCount }).map((_, index) => (
                <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder list
                    key={index}
                >
                    {renderItem ? renderItem(index) : <ListItemSkeleton />}
                </div>
            ))}
        </div>
    );
}
