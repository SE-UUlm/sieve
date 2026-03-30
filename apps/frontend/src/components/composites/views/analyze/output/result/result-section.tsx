import type { ReactNode } from "react";

type ResultSectionProps = {
    title: string;
    children: ReactNode;
    className?: string;
};

/**
 * Provides a consistent section wrapper for result-tab blocks.
 */
export function ResultSection({
    title,
    children,
    className,
}: ResultSectionProps) {
    return (
        <div className={className}>
            <h3 className="mb-3 text-sm font-semibold tracking-wider text-slate-500 uppercase">
                {title}
            </h3>
            {children}
        </div>
    );
}
