import type { ReactNode } from "react";

type JsonSyntaxHighlighterProps = {
    data: unknown;
    className?: string;
};

/**
 * Renders a JSON value with recursive syntax highlighting.
 *
 * - Keys → blue
 * - Strings → green
 * - Numbers → orange
 * - Booleans & null → purple
 * - Structural characters → gray
 */
export function JsonSyntaxHighlighter({
    data,
    className = "",
}: JsonSyntaxHighlighterProps) {
    return (
        <pre
            className={`min-w-full whitespace-pre-wrap font-mono text-xs ${className}`}
        >
            {highlightJson(data)}
        </pre>
    );
}

function highlightJson(value: unknown, indent = 0): ReactNode {
    const pad = "  ".repeat(indent);
    const padInner = "  ".repeat(indent + 1);

    if (value === null) {
        return (
            <span className="text-purple-600 dark:text-purple-400">null</span>
        );
    }

    if (typeof value === "boolean") {
        return (
            <span className="text-purple-600 dark:text-purple-400">
                {String(value)}
            </span>
        );
    }

    if (typeof value === "number") {
        return (
            <span className="text-orange-600 dark:text-orange-400">
                {String(value)}
            </span>
        );
    }

    if (typeof value === "string") {
        return (
            <span className="text-green-600 dark:text-green-400">
                &quot;{value}&quot;
            </span>
        );
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return <span className="text-slate-500">{"[]"}</span>;
        }
        return (
            <>
                <span className="text-slate-500">{"["}</span>
                {"\n"}
                {value.map((item, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: There is nothing more stable in this case than the index
                    <span key={i}>
                        {padInner}
                        {highlightJson(item, indent + 1)}
                        {i < value.length - 1 ? "," : ""}
                        {"\n"}
                    </span>
                ))}
                {pad}
                <span className="text-slate-500">{"]"}</span>
            </>
        );
    }

    if (typeof value === "object") {
        const entries = Object.entries(value);
        if (entries.length === 0) {
            return <span className="text-slate-500">{"{}"}</span>;
        }
        return (
            <>
                <span className="text-slate-500">{"{"}</span>
                {"\n"}
                {entries.map(([key, val], i) => (
                    <span key={key}>
                        {padInner}
                        <span className="text-blue-600 dark:text-blue-400">
                            &quot;{key}&quot;
                        </span>
                        <span className="text-slate-500">{": "}</span>
                        {highlightJson(val, indent + 1)}
                        {i < entries.length - 1 ? "," : ""}
                        {"\n"}
                    </span>
                ))}
                {pad}
                <span className="text-slate-500">{"}"}</span>
            </>
        );
    }

    return <span>{String(value)}</span>;
}
