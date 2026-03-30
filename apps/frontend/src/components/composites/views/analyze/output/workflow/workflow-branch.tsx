import type { CategoryResultDto } from "@/lib/client/models/categoryResultDto";
import { CopyActionButton } from "@/components/composites/views/analyze/output/common/copy-action-button";
import { WorkflowBranchStep } from "./workflow-branch-step";
import { WorkflowCard } from "./workflow-card";
import { WorkflowJsonViewer } from "./workflow-json-viewer";
import { WorkflowArrow, WorkflowStep } from "./workflow-primitives";

type WorkflowBranchProps = {
    categoryResult: CategoryResultDto;
    baseDelay?: number;
    delayStep?: number;
};

/**
 * Renders a single category branch within the workflow visualization.
 * Shows: category name → each step entry → structured_output JSON.
 */
export function WorkflowBranch({ categoryResult, baseDelay = 0, delayStep = 25 }: WorkflowBranchProps) {
    const { category, steps, structured_output } = categoryResult;

    // Collect step entries (e.g. summary, db_step, email_response)
    const stepEntries = Object.entries(steps);

    return (
        <div className="flex min-w-[220px] flex-1 flex-col items-center">
            {/* Category name */}
            <WorkflowStep
                label={category}
                isActive={true}
                isCompleted={true}
                delay={baseDelay}
            />

            {/* Steps */}
            {stepEntries.map(([key, value], index) => (
                <WorkflowBranchStep 
                    key={key} 
                    stepKey={key} 
                    value={value} 
                    delay={baseDelay + (index * 2 * delayStep) + delayStep}
                    delayStep={delayStep}
                />
            ))}

            {/* Structured Output */}
            <WorkflowArrow isActive={true} delay={baseDelay + (stepEntries.length * 2 * delayStep) + delayStep} />
            <WorkflowCard isVisible={true} className="relative" delay={baseDelay + (stepEntries.length * 2 * delayStep) + 2 * delayStep}>
                <CopyActionButton
                    title="Copy JSON"
                    copyText={JSON.stringify(structured_output)}
                />
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Structured Output
                </p>
                <WorkflowJsonViewer
                    data={structured_output as Record<string, unknown>}
                />
            </WorkflowCard>
        </div>
    );
}

