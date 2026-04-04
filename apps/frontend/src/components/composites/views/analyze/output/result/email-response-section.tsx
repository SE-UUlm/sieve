import { CopyActionButton } from "@/components/composites/views/analyze/output/common/copy-action-button";
import { ResultCard } from "@/components/composites/views/analyze/output/result/result-card";
import { ResultSection } from "@/components/composites/views/analyze/output/result/result-section";
import { StyledButton } from "@/components/ui/styled-button";
import { Check } from "lucide-react";
import {
    SubmitEmailResponseDto,
    useEmailControllerSendEmailResponse,
} from "@/lib/client";
import { showPersistentErrorToast } from "@/lib/toast";
import { Dispatch, SetStateAction } from "react";

type EmailResponseSectionProps = {
    result: SubmitEmailResponseDto;
    setResult: Dispatch<SetStateAction<SubmitEmailResponseDto | null>>;
};

/**
 * Displays the generated email response
 */
export function EmailResponseSection({
    result,
    setResult,
}: EmailResponseSectionProps) {
    const response = result.data.email_response;

    const { mutate, isPending } = useEmailControllerSendEmailResponse({
        mutation: {
            onSuccess: (response) => {
                if (response.status === 200) {
                    setResult(
                        (prev) =>
                            prev && {
                                ...prev,
                                email_reseponse_sent: true,
                            },
                    );
                    return;
                }

                showPersistentErrorToast({
                    title: "Email Response Send Failed",
                    description:
                        "There was an issue with the server. Please try again later.",
                });
            },
            onError: (error) => {
                console.error("[analyze] Email analysis request failed", error);
                showPersistentErrorToast({
                    title: "Email Response Send Failed",
                    description:
                        "There was an issue with the server. Please try again later.",
                });
            },
        },
    });

    /**
     * Submits the email content to the backend for analysis.
     */
    const sendResponse = () => {
        mutate({
            data: {
                receiptient: result.sender!,
                subject: null
                    ? `Re: ${null}` // TODO
                    : response?.response_subject || "Support Response",
                body: response!.response_body,
            },
        });
    };

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
            {result.email_reseponse_sent ? (
                <div className="text-slate-700 dark:text-slate-300 ml-4 mt-2 flex items-center">
                    <Check className="h-5 w-5 mr-1" />
                    Email Response was sent
                </div>
            ) : result.sender !== undefined ? (
                <StyledButton
                    label={"Send Email Response"}
                    sizeVariant="small"
                    disabled={
                        result.email_reseponse_sent ||
                        result.sender === undefined
                    }
                    className="w-fit mt-4 ml-2"
                    onClick={sendResponse}
                    isLoading={isPending}
                    loadingLabel="Sending Response..."
                />
            ) : null}
        </ResultSection>
    );
}
