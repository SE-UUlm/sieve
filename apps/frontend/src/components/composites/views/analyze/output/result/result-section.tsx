import type { ReactNode } from "react";

type ResultSectionProps = {
    title: string;
    children: ReactNode;
};

/**
 * Provides a consistent section wrapper for result-tab blocks.
 */
export function ResultSection({ title, children }: ResultSectionProps) {
    return (
        <div>
            <h3 className="mb-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                {title}
            </h3>
            {children}
        </div>
    );
}
