import { CopyActionButton } from "@/components/composites/views/analyze/output/common/copy-action-button";
import { WorkflowCard } from "./workflow-card";
import { WorkflowJsonViewer } from "./workflow-json-viewer";
import { WorkflowArrow } from "./workflow-primitives";

type WorkflowBranchStepProps = {
    stepKey: string;
    value: unknown;
    delay?: number;
    delayStep?: number;
};

/**
 * Renders a single step within a category branch.
 * Special-cases `email_response` to display only `response_body_part`.
 * Shows strings as plain text, objects via WorkflowJsonViewer.
 */
export function WorkflowBranchStep({ stepKey, value, delay = 0, delayStep = 25 }: WorkflowBranchStepProps) {
    if (stepKey === "email_response" && value === null) { // Do not show email response if there is no email response
        return null;
    }

    const copyText =
        typeof value === "string" ? value : JSON.stringify(value);

    return (
        <div className="flex w-full flex-col items-center">
            <WorkflowArrow isActive={true} delay={delay} />
            <WorkflowCard isVisible={true} delay={delay + delayStep}>
                <CopyActionButton title="Copy" copyText={copyText} />
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {formatStepKey(stepKey)}
                </p>
                <div className="text-sm text-slate-700 dark:text-slate-300">
                    <StepContent stepKey={stepKey} value={value} />
                </div>
            </WorkflowCard>
        </div>
    );
}

/** Renders the value of a step based on its key and type. */
function StepContent({ stepKey, value }: { stepKey: string; value: unknown }) {
    // email_response → show only response_body_part as text
    if (
        stepKey === "email_response" &&
        value != null &&
        typeof value === "object" &&
        "response_body_part" in value
    ) {
        const part = (value as { response_body_part: string })
            .response_body_part;
        return <span className="whitespace-pre-wrap">{part}</span>;
    }

    if (typeof value === "string") {
        return <span>{value}</span>;
    }

    if (value != null && typeof value === "object") {
        return (
            <WorkflowJsonViewer data={value as Record<string, unknown>} />
        );
    }

    return <span>—</span>;
}

/** Formats a snake_case step key into a readable label. */
function formatStepKey(key: string): string {
    return key.replace(/_/g, " ");
}
