import { ScrollArea, ScrollBar } from "@/components/primitives/scroll-area";
import { StyledSkeleton } from "@/components/ui/styled-skeleton";
import { JsonSyntaxHighlighter } from "../common/json-syntax-highlighter";

type WorkflowJsonViewerProps = {
    data: Record<string, unknown> | undefined;
    isLoading?: boolean;
};

/**
 * Renders a syntax-highlighted JSON preview for workflow output data.
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

    return (
        <ScrollArea className="w-full">
            <JsonSyntaxHighlighter data={data} className="max-h-110" />
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}
