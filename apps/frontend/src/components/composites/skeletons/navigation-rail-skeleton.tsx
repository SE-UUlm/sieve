import { StyledSkeleton } from "@/components/ui/styled-skeleton";
import { cn } from "@/lib/utils/shadcn-helper";

type NavigationRailSkeletonProps = {
    className?: string;
    navItemCount?: number;
};

export function NavigationRailSkeleton({
    className,
    navItemCount = 3,
}: NavigationRailSkeletonProps) {
    return (
        <aside
            className={cn(
                "flex h-screen w-16 shrink-0 flex-col items-center border-r border-slate-200 bg-white py-6 md:w-20 dark:border-slate-800 dark:bg-slate-900",
                className,
            )}
        >
            <StyledSkeleton className="mb-10 size-9 rounded-xl" />

            <div className="flex w-full flex-1 flex-col items-center gap-6">
                {Array.from({ length: navItemCount }).map((_, index) => (
                    <StyledSkeleton
                        // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder list
                        key={index}
                        className="size-10 rounded-xl"
                    />
                ))}
            </div>

            <div className="mt-auto mb-2 flex flex-col items-center gap-4">
                <StyledSkeleton className="size-10 rounded-xl" />
                <StyledSkeleton className="size-10 rounded-xl" />
            </div>
        </aside>
    );
}
