import { FileJson } from "lucide-react";
import { SectionedResultSkeleton } from "@/components/composites/skeletons";
import type { AnalysisResult } from "../model/analysis-result";
import { CategorySection } from "./result/category-section";
import { DataSection } from "./result/data-section";
import { SummarySection } from "./result/summary-section";
import { EmailResponseSection } from "./result/email-response-section";

type ResultTabProps = {
    result: AnalysisResult | null;
    isLoading: boolean;
};

/**
 * Displays extracted analysis details and raw structured payload.
 */
export function ResultTab({ result, isLoading }: ResultTabProps) {
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
            <CategorySection result={result} />
            <SummarySection result={result} />
            <EmailResponseSection result={result} />
            <DataSection result={result} />
        </div>
    );
}
