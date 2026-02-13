import { WorkflowCard } from "@/components/composites/views/analyze/output/workflow/workflow-card";
import { WorkflowJsonViewer } from "@/components/composites/views/analyze/output/workflow/workflow-json-viewer";
import {
    WorkflowArrow,
    WorkflowStep,
} from "@/components/composites/views/analyze/output/workflow/workflow-primitives";
import { StyledSkeleton } from "@/components/ui/styled-skeleton";
import {
    type AnalysisResult,
    getAnalysisSummary,
} from "../model/analysis-result";

type WorkflowTabProps = {
    result: AnalysisResult | null;
    isAnalyzing: boolean;
    step: number;
    staticCompleted?: boolean;
};

/**
 * Visualizes the analysis workflow state and intermediate placeholders.
 */
export function WorkflowTab({
    result,
    isAnalyzing = false,
    step = 0,
    staticCompleted = false,
}: WorkflowTabProps) {
    const currentStep = staticCompleted ? 4 : step;
    const hasResult = !!result;

    return (
        <div className="mx-auto flex w-full max-w-sm flex-col items-center space-y-4 py-8">
            {/* --- STEP 1: Categorization --- */}
            <WorkflowStep
                label="Categorizing"
                isActive={staticCompleted || isAnalyzing || hasResult}
                isCompleted={staticCompleted || hasResult}
            />

            <WorkflowArrow isActive={currentStep > 0} />

            {/* --- STEP 2: Summary Card --- */}
            <WorkflowCard isVisible={currentStep >= 1}>
                {hasResult ? (
                    <div className="text-sm text-slate-700 dark:text-slate-300">
                        {result ? getAnalysisSummary(result) : null}
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

            {/* --- STEP 3: Generation Label --- */}
            <WorkflowStep
                label="Generating product request json"
                isActive={currentStep >= 2}
                isCompleted={currentStep > 2}
            />

            <WorkflowArrow isActive={currentStep > 2} />

            {/* --- STEP 4: JSON Output Card --- */}
            <WorkflowCard isVisible={currentStep >= 3} className="relative">
                <WorkflowJsonViewer
                    data={result ?? undefined}
                    isLoading={!hasResult}
                />
            </WorkflowCard>

            <WorkflowArrow isActive={currentStep >= 3} />

            {/* --- STEP 5: DB Lookup Label --- */}
            <WorkflowStep
                label="Looking in DB for Product"
                isActive={currentStep >= 4}
                isCompleted={currentStep >= 4}
            />
        </div>
    );
}
