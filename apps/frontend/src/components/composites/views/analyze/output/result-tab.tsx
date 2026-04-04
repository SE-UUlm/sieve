import { FileJson } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { SectionedResultSkeleton } from "@/components/composites/skeletons";
import type { CreateEmailDto, SubmitEmailResponseDto } from "@/lib/client";
import { CategorySection } from "./result/category-section";
import { ConfidenceSection } from "./result/confidence-section";
import { DataSection } from "./result/data-section";
import { EmailResponseSection } from "./result/email-response-section";
import { SummarySection } from "./result/summary-section";

type ResultTabProps = {
    result: SubmitEmailResponseDto | null;
    isLoading: boolean;
    setResult: Dispatch<SetStateAction<SubmitEmailResponseDto | null>>;
    request: CreateEmailDto | undefined;
};

/**
 * Displays extracted analysis details and raw structured payload.
 */
export function ResultTab({
    result,
    isLoading,
    setResult,
    request,
}: ResultTabProps) {
    if (isLoading) {
        return <SectionedResultSkeleton />;
    }

    if (!result) {
        return (
            <div className="animate-in fade-in zoom-in-95 flex h-64 flex-col items-center justify-center text-slate-400 duration-300 dark:text-slate-500">
                <FileJson size={48} className="mb-4 opacity-20" />
                <p>No analysis result yet.</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in zoom-in-95 w-full space-y-6 duration-300">
            <CategorySection result={result.data} />
            <SummarySection result={result.data} />
            <EmailResponseSection
                result={result}
                setResult={setResult}
                request={request}
            />
            <ConfidenceSection result={result.data} />
            <DataSection result={result.data} />
        </div>
    );
}
