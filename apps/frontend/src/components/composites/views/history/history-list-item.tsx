"use client";

type HistoryEntry = {
    id: string;
    subject: string;
    body: string;
};

type HistoryListItemProps = {
    entry: HistoryEntry;
    isSelected: boolean;
    onSelectAction: (id: string) => void;
};

export function HistoryListItem({
    entry,
    isSelected,
    onSelectAction,
}: HistoryListItemProps) {
    return (
        <button
            key={entry.id}
            type="button"
            onClick={() => onSelectAction(entry.id)}
            className={`w-full rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                isSelected
                    ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900"
            }`}
        >
            <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                {entry.subject || "Untitled mail"}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                {entry.body || "No content preview available."}
            </p>
        </button>
    );
}
