import { Check } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { CopyActionButton } from "@/components/composites/views/analyze/output/common/copy-action-button";
import { ResultCard } from "@/components/composites/views/analyze/output/result/result-card";
import { ResultSection } from "@/components/composites/views/analyze/output/result/result-section";
import { StyledButton } from "@/components/ui/styled-button";
import {
    type CreateEmailDto,
    type SubmitEmailResponseDto,
    useEmailControllerSendEmailResponse,
} from "@/lib/client";
import { showPersistentErrorToast, showSuccessToast } from "@/lib/toast";

type SendEmailResponseToast = {
    title: string;
    description: string;
};

function getSendResponseErrorToastFromStatus(
    status: number,
): SendEmailResponseToast {
    if (status === 400) {
        return {
            title: "Invalid Recipient Address",
            description:
                "The sender's email address is not valid. Cannot send a response.",
        };
    }

    if (status === 503) {
        return {
            title: "Email Sending Unavailable",
            description:
                "Email sending is not configured for this instance. Please contact an admin.",
        };
    }

    return {
        title: "Email Response Send Failed",
        description:
            "There was an issue sending the response. Please try again later.",
    };
}

function getSendResponseErrorToastFromError(
    error: unknown,
): SendEmailResponseToast {
    if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        typeof error.status === "number"
    ) {
        return getSendResponseErrorToastFromStatus(error.status);
    }

    return getSendResponseErrorToastFromStatus(500);
}

type EmailResponseSectionProps = {
    result: SubmitEmailResponseDto;
    setResult: Dispatch<SetStateAction<SubmitEmailResponseDto | null>>;
    request: CreateEmailDto | undefined;
};

/**
 * Displays the generated email response
 */
export function EmailResponseSection({
    result,
    setResult,
    request,
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
                                email_response_sent: true,
                            },
                    );
                    showSuccessToast({ title: "Email Response Sent" });
                    return;
                }

                showPersistentErrorToast(
                    getSendResponseErrorToastFromStatus(response.status),
                );
            },
            onError: (error) => {
                console.error("[analyze] Email Response Send failed", error);
                showPersistentErrorToast(
                    getSendResponseErrorToastFromError(error),
                );
            },
        },
    });

    const sendResponse = () => {
        if (!response || !request?.sender) return;
        mutate({
            data: {
                recipient: request.sender,
                subject: request?.subject
                    ? `Re: ${request.subject}`
                    : response?.response_subject || "Support Response",
                body: response.response_body,
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
            {result.email_response_sent ? (
                <div className="text-slate-700 dark:text-slate-300 ml-4 mt-2 flex items-center">
                    <Check className="h-5 w-5 mr-1" />
                    Email Response was sent
                </div>
            ) : request?.sender !== undefined ? (
                <StyledButton
                    label={"Send Email Response"}
                    sizeVariant="small"
                    disabled={
                        result.email_response_sent ||
                        request?.sender === undefined
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
