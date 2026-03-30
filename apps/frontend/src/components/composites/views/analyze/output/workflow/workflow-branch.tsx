import type { CategoryResultDto } from "@/lib/client/models/categoryResultDto";
import { WorkflowBranchStep } from "./workflow-branch-step";
import { WorkflowCard } from "./workflow-card";
import { WorkflowJsonViewer } from "./workflow-json-viewer";
import { WorkflowArrow, WorkflowStep } from "./workflow-primitives";

type WorkflowBranchProps = {
    categoryResult: CategoryResultDto;
};

/**
 * Renders a single category branch within the workflow visualization.
 * Shows: category name → each step entry → structured_output JSON.
 */
export function WorkflowBranch({ categoryResult }: WorkflowBranchProps) {
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
            />

            {/* Steps */}
            {stepEntries.map(([key, value]) => (
                <WorkflowBranchStep key={key} stepKey={key} value={value} />
            ))}

            {/* Structured Output */}
            <WorkflowArrow isActive={true} />
            <WorkflowCard isVisible={true} className="relative">
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

