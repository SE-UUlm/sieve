import type { AnalysisResult } from "@/components/composites/views/analyze/model/analysis-result";
import { CopyActionButton } from "@/components/composites/views/analyze/output/common/copy-action-button";
import { ResultCard } from "@/components/composites/views/analyze/output/result/result-card";
import { ResultSection } from "@/components/composites/views/analyze/output/result/result-section";
import { StyledButton } from "@/components/ui/styled-button";
import { SubmitEmailResponseDto } from "@/lib/client";

type EmailResponseSectionProps = {
    result: SubmitEmailResponseDto;
};

/**
 * Displays the generated email response
 */
export function EmailResponseSection({ result }: EmailResponseSectionProps) {
    const response = result.data.email_response;

    const buttonLabel = result.email_reseponse_sent
        ? "Email Response Sent"
        : result.sender === undefined
          ? "Sender Address unknown"
          : "Send Email Response";

    if (!response) return null;

    return (
        <ResultSection title="Email Response">
            <StyledButton
                label={buttonLabel}
                sizeVariant="medium"
                disabled={
                    result.email_reseponse_sent || result.sender === undefined
                }
            />
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
