import { StyledSkeleton } from "@/components/ui/styled-skeleton";
import { cn } from "@/lib/utils/shadcn-helper";
import { TextBlockSkeleton } from "./text-block-skeleton";

type ListItemSkeletonProps = {
    className?: string;
    titleWidthClassName?: string;
    descriptionLineCount?: number;
    descriptionWidths?: string[];
    showTrailingAction?: boolean;
};

export function ListItemSkeleton({
    className,
    titleWidthClassName = "w-1/3",
    descriptionLineCount = 2,
    descriptionWidths = ["w-full", "w-2/3"],
    showTrailingAction = false,
}: ListItemSkeletonProps) {
    return (
        <div
            className={cn(
                "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60",
                className,
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                    <StyledSkeleton
                        className={cn("h-4", titleWidthClassName)}
                    />
                    <TextBlockSkeleton
                        lineCount={descriptionLineCount}
                        lineHeightClassName="h-3"
                        lineWidths={descriptionWidths}
                    />
                </div>
                {showTrailingAction && (
                    <StyledSkeleton className="h-9 w-24 shrink-0" />
                )}
            </div>
        </div>
    );
}
