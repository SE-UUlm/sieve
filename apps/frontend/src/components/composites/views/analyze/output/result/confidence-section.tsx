import type { AnalysisResult } from "@/components/composites/views/analyze/model/analysis-result";
import { ResultCard } from "@/components/composites/views/analyze/output/result/result-card";
import { ResultSection } from "@/components/composites/views/analyze/output/result/result-section";

type ConfidenceSectionProps = {
    result: AnalysisResult;
};

/**
 * Displays AI confidence for the overall drafted response.
 */
export function ConfidenceSection({ result }: ConfidenceSectionProps) {
    const confidence = result.confidence_assessment;
    const scoreText =
        typeof confidence.score === "number"
            ? `${confidence.score}/100`
            : "N/A";

    return (
        <ResultSection title="Confidence">
            <ResultCard className="space-y-3">
                <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                    Score
                </p>
                <p className="text-2xl leading-none font-semibold text-slate-900 dark:text-slate-100">
                    {scoreText}
                </p>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-break-spaces">
                    {confidence.rationale}
                </p>
            </ResultCard>
        </ResultSection>
    );
}
