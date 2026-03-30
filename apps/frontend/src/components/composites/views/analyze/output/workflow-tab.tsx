import { WorkflowBranch } from "@/components/composites/views/analyze/output/workflow/workflow-branch";
import { WorkflowCard } from "@/components/composites/views/analyze/output/workflow/workflow-card";
import {
    WorkflowArrow,
    WorkflowStep,
} from "@/components/composites/views/analyze/output/workflow/workflow-primitives";
import { StyledSkeleton } from "@/components/ui/styled-skeleton";
import {
    type AnalysisResult,
    getAnalysisCategories,
} from "../model/analysis-result";
import { CopyActionButton } from "./common/copy-action-button";

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

    const delayStep = 50;

    // Calculate max delay in branches to sequence the final elements cleanly
    const maxBranchSteps =
        result?.category_results.reduce(
            (max, cr) => Math.max(max, Object.keys(cr.steps).length),
            0,
        ) || 0;

    // Base 0..4 steps * delayStep
    const branchBaseDelay = 4 * delayStep;
    // Each branch step has an arrow (delayStep) and a card (delayStep) -> 2 * delayStep
    // Plus the final branch structural arrow + card -> 2 * delayStep
    const branchMaxDelay =
        branchBaseDelay + maxBranchSteps * 2 * delayStep + 2 * delayStep;

    return (
        <div className="animate-in fade-in zoom-in-95 mx-auto flex w-fit min-w-full flex-col items-center space-y-4 py-8">
            {/* --- STEP 1: Categorization --- */}
            <WorkflowStep
                label="Categorizing"
                isActive={staticCompleted || isAnalyzing || hasResult}
                isCompleted={staticCompleted || hasResult}
                delay={0 * delayStep}
            />

            <WorkflowArrow isActive={currentStep > 0} delay={1 * delayStep} />

            {/* --- STEP 2: Category labels --- */}
            <WorkflowCard isVisible={currentStep >= 1} delay={2 * delayStep}>
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

            <WorkflowArrow isActive={currentStep > 1} delay={3 * delayStep} />

            {/* ── STEP 3: Branching per category ── */}
            {hasResult && result.category_results.length > 0 && (
                <>
                    <div className="flex items-start gap-6">
                        {result.category_results.map((cr) => (
                            <WorkflowBranch
                                key={cr.category}
                                categoryResult={cr}
                                baseDelay={branchBaseDelay}
                                delayStep={delayStep}
                            />
                        ))}
                    </div>

                    {/* ── Merge arrow ── */}
                    <WorkflowArrow
                        isActive={true}
                        delay={branchMaxDelay + delayStep}
                    />
                </>
            )}

            {/* ── STEP 4: Overall Email Response ── */}
            {hasResult && result.email_response && (
                <WorkflowCard
                    isVisible={true}
                    delay={branchMaxDelay + 2 * delayStep}
                >
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
