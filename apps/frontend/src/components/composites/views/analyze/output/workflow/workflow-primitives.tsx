import { ArrowDown } from "lucide-react";

type WorkflowStepProps = {
    label: string;
    isActive: boolean;
    isCompleted: boolean;
};

export function WorkflowStep({
    label,
    isActive,
    isCompleted,
}: WorkflowStepProps) {
    return (
        <div
            className={`text-center transition-all duration-300 ${
                isActive ? "opacity-100" : "opacity-40"
            }`}
        >
            <p
                className={`text-lg font-light tracking-wide ${
                    isCompleted
                        ? "text-slate-900 dark:text-slate-200"
                        : "text-slate-400 dark:text-slate-500"
                }`}
            >
                {label}
            </p>
        </div>
    );
}

type WorkflowArrowProps = {
    isActive: boolean;
};

export function WorkflowArrow({ isActive }: WorkflowArrowProps) {
    return (
        <div
            className={`py-1 transition-colors duration-500 ${
                isActive
                    ? "text-slate-400 dark:text-slate-400"
                    : "text-slate-200 dark:text-slate-800"
            }`}
        >
            <ArrowDown size={24} strokeWidth={1.5} />
        </div>
    );
}
