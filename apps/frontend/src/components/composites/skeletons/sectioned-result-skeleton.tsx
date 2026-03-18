import { StyledSkeleton } from "@/components/ui/styled-skeleton";
import { SkeletonCard } from "./skeleton-card";
import { TextBlockSkeleton } from "./text-block-skeleton";

type SectionedResultSkeletonProps = {
    sectionCount?: number;
};

export function SectionedResultSkeleton({
    sectionCount = 3,
}: SectionedResultSkeletonProps) {
    return (
        <div className="animate-in fade-in zoom-in-95 w-full space-y-6 duration-300">
            {Array.from({ length: sectionCount }).map((_, index) => (
                <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder list
                    key={index}
                >
                    <StyledSkeleton className="mb-3 h-3 w-20" />
                    <SkeletonCard>
                        <TextBlockSkeleton
                            lineCount={index === sectionCount - 1 ? 1 : 3}
                            lineHeightClassName={
                                index === sectionCount - 1 ? "h-6" : "h-3"
                            }
                            lineWidths={
                                index === sectionCount - 1
                                    ? ["w-24"]
                                    : ["w-full", "w-5/6", "w-2/3"]
                            }
                        />
                    </SkeletonCard>
                </div>
            ))}
        </div>
    );
}
