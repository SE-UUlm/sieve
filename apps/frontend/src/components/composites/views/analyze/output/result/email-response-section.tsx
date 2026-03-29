import type { AnalysisResult } from "@/components/composites/views/analyze/model/analysis-result";
import { CopyActionButton } from "@/components/composites/views/analyze/output/common/copy-action-button";
import { ResultCard } from "@/components/composites/views/analyze/output/result/result-card";
import { ResultSection } from "@/components/composites/views/analyze/output/result/result-section";

type EmailResponseSectionProps = {
    result: AnalysisResult;
};

/**
 * Displays the generated email response
 */
export function EmailResponseSection({ result }: EmailResponseSectionProps) {
    const response = result.email_response;

    if (!response) return null;

    return (
        <ResultSection title="Email Response">
            <ResultCard className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-break-spaces">
                <CopyActionButton
                    title="Copy Email body"
                    copyText={response.response_body}
                />
                {response.response_body}
            </ResultCard>
        </ResultSection>
    );
}
