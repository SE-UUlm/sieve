import { StyledSkeleton } from "@/components/ui/styled-skeleton";
import { cn } from "@/lib/utils/shadcn-helper";
import { TextBlockSkeleton } from "./text-block-skeleton";

type FormSkeletonProps = {
    fieldCount?: number;
    className?: string;
    includeHeader?: boolean;
    buttonWidthClassName?: string;
};

export function FormSkeleton({
    fieldCount = 2,
    className,
    includeHeader = true,
    buttonWidthClassName = "w-full",
}: FormSkeletonProps) {
    return (
        <div className={cn("space-y-6", className)}>
            {includeHeader && (
                <div className="space-y-3">
                    <StyledSkeleton className="mx-auto h-10 w-2/3 max-w-xs" />
                    <TextBlockSkeleton
                        className="mx-auto max-w-sm"
                        lineCount={2}
                        lineWidths={["w-full", "w-5/6"]}
                        lineClassName="mx-auto"
                    />
                </div>
            )}

            <div className="space-y-4">
                {Array.from({ length: fieldCount }).map((_, index) => (
                    <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder list
                        key={index}
                        className="space-y-2"
                    >
                        <StyledSkeleton className="h-4 w-20" />
                        <StyledSkeleton className="h-12 w-full" />
                    </div>
                ))}
            </div>

            <StyledSkeleton className={cn("h-12", buttonWidthClassName)} />
        </div>
    );
}
