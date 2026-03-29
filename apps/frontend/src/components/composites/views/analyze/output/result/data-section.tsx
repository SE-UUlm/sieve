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
    const categories = result.category_results;

    return (
        <ResultSection title="Extracted Data" className="space-y-6">
            {categories.map((category) => (
                <div key={category.category}>
                    {categories.length > 1 && (
                        <h4 className="mb-3 text-xs tracking-wider text-slate-500 uppercase">
                            {category.category}
                        </h4>
                    )}
                    <ResultCard className="font-mono text-sm text-blue-600 dark:text-blue-300">
                        <CopyActionButton
                            title="Copy JSON"
                            copyText={JSON.stringify(
                                category.structured_output,
                            )}
                        />
                        <ScrollArea className="w-full pr-6">
                            <pre className="min-w-full whitespace-break-spaces">
                                {JSON.stringify(
                                    category.structured_output,
                                    null,
                                    2,
                                )}
                            </pre>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </ResultCard>
                </div>
            ))}
        </ResultSection>
    );
}
