import {
    type AnalysisResult,
    getAnalysisSummary,
} from "@/components/composites/views/analyze/model/analysis-result";
import { CopyActionButton } from "@/components/composites/views/analyze/output/common/copy-action-button";
import { ResultCard } from "@/components/composites/views/analyze/output/result/result-card";
import { ResultSection } from "@/components/composites/views/analyze/output/result/result-section";

type SummarySectionProps = {
    result: AnalysisResult;
};

/**
 * Displays the extracted summary text.
 */
export function SummarySection({ result }: SummarySectionProps) {
    return (
        <ResultSection title="Summary">
            <ResultCard className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <CopyActionButton
                    title="Copy Summary"
                    copyText={getAnalysisSummary(result)}
                />
                {getAnalysisSummary(result)}
            </ResultCard>
        </ResultSection>
    );
}
