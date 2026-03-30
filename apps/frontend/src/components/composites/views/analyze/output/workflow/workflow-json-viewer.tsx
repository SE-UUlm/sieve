import { ScrollArea, ScrollBar } from "@/components/primitives/scroll-area";
import { StyledSkeleton } from "@/components/ui/styled-skeleton";

type WorkflowJsonViewerProps = {
    data: Record<string, unknown> | undefined;
    isLoading?: boolean;
};

/**
 * Renders a compact JSON preview for workflow output data.
 */
export function WorkflowJsonViewer({
    data,
    isLoading,
}: WorkflowJsonViewerProps) {
    if (!data && !isLoading) return null;

    if (isLoading || !data) {
        return (
            <div className="flex flex-col gap-2 opacity-50">
                <StyledSkeleton className="h-2 w-full" />
                <StyledSkeleton className="h-2 w-3/4" />
                <StyledSkeleton className="h-2 w-1/2" />
            </div>
        );
    }

    const prettyJson = JSON.stringify(data, null, 2);

    return (
        <ScrollArea className=" w-full">
            <pre className="max-h-72 min-w-full whitespace-pre-wrap font-mono text-xs text-slate-700 dark:text-slate-300">
                {prettyJson}
            </pre>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}
