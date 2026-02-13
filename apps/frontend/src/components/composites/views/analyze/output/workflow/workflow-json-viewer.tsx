import type { AnalysisResult } from "@/components/composites/views/analyze/model/analysis-result";
import { ScrollArea, ScrollBar } from "@/components/primitives/scroll-area";
import { StyledSkeleton } from "@/components/ui/styled-skeleton";

type WorkflowJsonViewerProps = {
    data: AnalysisResult | undefined;
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

    return (
        <ScrollArea className="max-h-72 w-full">
            <div className="w-max min-w-full font-mono text-xs text-blue-700 dark:text-slate-400">
                <span className="text-slate-400 dark:text-slate-500">{`{`}</span>
                {Object.entries(data).map(([key, value], i, arr) => (
                    <div key={key} className="pl-4">
                        <span className="text-blue-600 dark:text-blue-400">
                            &#34;{key}&#34;
                        </span>
                        :{" "}
                        <span className="text-orange-600 dark:text-orange-300">
                            {typeof value === "string"
                                ? `"${value}"`
                                : JSON.stringify(value)}
                        </span>
                        {i < arr.length - 1 ? "," : ""}
                    </div>
                ))}
                <span className="text-slate-400 dark:text-slate-500">{`}`}</span>
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}
