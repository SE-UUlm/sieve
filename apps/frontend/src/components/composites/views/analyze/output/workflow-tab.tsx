import { WorkflowBranch } from "@/components/composites/views/analyze/output/workflow/workflow-branch";
import { WorkflowCard } from "@/components/composites/views/analyze/output/workflow/workflow-card";
import {
    WorkflowArrow,
    WorkflowStep,
} from "@/components/composites/views/analyze/output/workflow/workflow-primitives";
import { CopyActionButton } from "./common/copy-action-button";
import { StyledSkeleton } from "@/components/ui/styled-skeleton";
import {
    type AnalysisResult,
    getAnalysisCategories,
} from "../model/analysis-result";

type WorkflowTabProps = {
    result: AnalysisResult | null;
    isAnalyzing: boolean;
    step: number;
    staticCompleted?: boolean;
};

/**
 * Visualizes the analysis workflow with branching per category.
 *
 * Layout:
 *   Categorizing  →  branches (one per category_result)  →  merge  →  email_response
 */
export function WorkflowTab({
    result,
    isAnalyzing = false,
    step = 0,
    staticCompleted = false,
}: WorkflowTabProps) {
    const currentStep = staticCompleted ? 4 : step;
    const hasResult = !!result;
    const categories = result ? getAnalysisCategories(result) : [];

    return (
        <div className="mx-auto flex w-full flex-col items-center space-y-4 py-8">
            {/* --- STEP 1: Categorization --- */}
            <WorkflowStep
                label="Categorizing"
                isActive={staticCompleted || isAnalyzing || hasResult}
                isCompleted={staticCompleted || hasResult}
            />

            <WorkflowArrow isActive={currentStep > 0} />

            {/* --- STEP 2: Category labels --- */}
            <WorkflowCard isVisible={currentStep >= 1}>
                {hasResult && (
                    <CopyActionButton
                        title="Copy categories"
                        copyText={categories.join(", ")}
                    />
                )}
                {hasResult ? (
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                        {categories.length > 0
                            ? categories.join(", ")
                            : "No matching categories found."}
                    </div>
                ) : (
                    // Simple text skeleton
                    <div className="space-y-2">
                        <StyledSkeleton className="h-2 w-1/3" />
                        <StyledSkeleton className="h-2 w-2/3" />
                    </div>
                )}
            </WorkflowCard>

            <WorkflowArrow isActive={currentStep > 1} />

            {/* ── STEP 3: Branching per category ── */}
            {hasResult && result.category_results.length > 0 && (
                <>
                    <div className="flex w-full items-start justify-center gap-6">
                        {result.category_results.map((cr) => (
                            <WorkflowBranch
                                key={cr.category}
                                categoryResult={cr}
                            />
                        ))}
                    </div>

                    {/* ── Merge arrow ── */}
                    <WorkflowArrow isActive={true} />
                </>
            )}

            {/* ── STEP 4: Overall Email Response ── */}
            {hasResult && result.email_response && (
                <WorkflowCard isVisible={true}>
                    <CopyActionButton
                        title="Copy email response"
                        copyText={result.email_response.response_body}
                    />
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Overall Email Response
                    </p>
                    <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                        <p className="whitespace-pre-wrap">
                            {result.email_response.response_body}
                        </p>
                    </div>
                </WorkflowCard>
            )}
        </div>
    );
}

