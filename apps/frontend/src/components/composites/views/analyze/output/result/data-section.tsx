import type { AnalysisResult } from "@/components/composites/views/analyze/model/analysis-result";
import { CopyActionButton } from "@/components/composites/views/analyze/output/common/copy-action-button";
import { JsonSyntaxHighlighter } from "@/components/composites/views/analyze/output/common/json-syntax-highlighter";
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
                    <ResultCard className="font-mono text-sm">
                        <CopyActionButton
                            title="Copy JSON"
                            copyText={JSON.stringify(
                                category.structured_output,
                            )}
                        />
                        <ScrollArea className="w-full pr-6">
                            <JsonSyntaxHighlighter
                                data={category.structured_output}
                            />
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </ResultCard>
                </div>
            ))}
        </ResultSection>
    );
}
