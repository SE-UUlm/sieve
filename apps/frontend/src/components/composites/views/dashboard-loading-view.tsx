import {
    ListSkeleton,
    NavigationRailSkeleton,
    SplitViewSkeleton,
    TextBlockSkeleton,
} from "@/components/composites/skeletons";
import { StyledSkeleton } from "@/components/ui/styled-skeleton";

/**
 * Displays a dashboard-shaped skeleton while authentication is resolving.
 */
export function DashboardLoadingView() {
    const primaryContent = (
        <div className="mx-auto flex h-full w-full flex-col">
            <div className="mb-8 space-y-3">
                <StyledSkeleton className="h-9 w-56" />
                <TextBlockSkeleton
                    lineCount={2}
                    lineWidths={["w-3/4", "w-1/2"]}
                />
            </div>

            <ListSkeleton
                itemCount={3}
                renderItem={(index) => (
                    <div className={index > 0 ? "opacity-80" : undefined}>
                        <StyledSkeleton className="mb-3 h-4 w-1/3" />
                        <TextBlockSkeleton
                            lineCount={2}
                            lineWidths={["w-full", "w-2/3"]}
                        />
                    </div>
                )}
            />
        </div>
    );

    const secondaryContent = (
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col space-y-4">
            <StyledSkeleton className="h-10 w-32" />
            <TextBlockSkeleton lineCount={3} />
            <StyledSkeleton className="h-56 w-full" />
        </div>
    );

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
            <NavigationRailSkeleton />
            <main className="relative flex h-full w-full overflow-hidden">
                <SplitViewSkeleton
                    primaryContent={primaryContent}
                    secondaryContent={secondaryContent}
                />
            </main>
        </div>
    );
}
