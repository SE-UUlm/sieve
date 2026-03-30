import { ArrowDown } from "lucide-react";

type WorkflowStepProps = {
    label: string;
    isActive: boolean;
    isCompleted: boolean;
    delay?: number;
};

export function WorkflowStep({
    label,
    isActive,
    isCompleted,
    delay = 0,
}: WorkflowStepProps) {
    return (
        <div
            className={`text-center transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both ${
                isActive ? "opacity-100" : "opacity-40"
            }`}
            style={{ animationDelay: `${delay}ms` }}
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
    delay?: number;
};

export function WorkflowArrow({ isActive, delay = 0 }: WorkflowArrowProps) {
    return (
        <div
            className={`py-1 transition-colors duration-300 animate-in fade-in zoom-in fill-mode-both ${
                isActive
                    ? "text-slate-400 dark:text-slate-400"
                    : "text-slate-200 dark:text-slate-800"
            }`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <ArrowDown size={24} strokeWidth={1.5} />
        </div>
    );
}
