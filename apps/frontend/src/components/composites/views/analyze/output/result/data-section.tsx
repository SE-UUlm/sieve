import type { AnalysisResult } from "@/components/composites/views/analyze/model/analysis-result";
import { CopyActionButton } from "@/components/composites/views/analyze/output/common/copy-action-button";
import { ScrollArea, ScrollBar } from "@/components/primitives/scroll-area";
import { ResultCard } from "./result-card";
import { ResultSection } from "./result-section";

type DataSectionProps = {
    result: AnalysisResult;
};

/**
 * Displays the raw structured analysis payload.
 */
export function DataSection({ result }: DataSectionProps) {
    return (
        <ResultSection title="Extracted Data">
            <ResultCard className="font-mono text-sm text-blue-600 dark:text-blue-300">
                <CopyActionButton
                    title="Copy JSON"
                    copyText={JSON.stringify(result, null, 2)}
                />
                <ScrollArea className="w-full pr-6">
                    <pre className="min-w-full whitespace-break-spaces">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </ResultCard>
        </ResultSection>
    );
}
