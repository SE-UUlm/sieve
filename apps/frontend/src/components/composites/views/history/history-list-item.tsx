"use client";

import { Inbox, Mail } from "lucide-react";

type EmailSource = "MANUAL" | "IMAP";

type HistoryEntry = {
    id: string;
    subject: string;
    body: string;
    source?: EmailSource;
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
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectAction(entry.id)}
            className={`w-full rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                isSelected
                    ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900"
            }`}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                    {entry.source === "IMAP" ? (
                        <Inbox className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                    ) : (
                        <Mail className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                        {entry.subject || "Untitled mail"}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                        {entry.body || "No content preview available."}
                    </p>
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                        {entry.source === "IMAP"
                            ? "IMAP Import"
                            : "Manual Entry"}
                    </p>
                </div>
            </div>
        </button>
    );
}
