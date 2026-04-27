import { StyledSkeleton } from "@/components/ui/styled-skeleton";
import { cn } from "@/lib/utils/shadcn-helper";

type TextBlockSkeletonProps = {
    lineCount?: number;
    lineHeightClassName?: string;
    lineWidths?: string[];
    className?: string;
    lineClassName?: string;
};

const DEFAULT_WIDTHS = ["w-full", "w-11/12", "w-3/4"];

export function TextBlockSkeleton({
    lineCount = 3,
    lineHeightClassName = "h-3",
    lineWidths = DEFAULT_WIDTHS,
    className,
    lineClassName,
}: TextBlockSkeletonProps) {
    return (
        <div className={cn("space-y-2", className)}>
            {Array.from({ length: lineCount }).map((_, index) => {
                const widthClassName =
                    lineWidths[index] ?? lineWidths[lineWidths.length - 1];

                return (
                    <StyledSkeleton
                        // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder list
                        key={index}
                        className={cn(
                            lineHeightClassName,
                            widthClassName,
                            lineClassName,
                        )}
                    />
                );
            })}
        </div>
    );
}
