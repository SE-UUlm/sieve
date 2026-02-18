"use client";

import { FileJson, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AnalysisResult } from "@/components/composites/views/analyze/model/analysis-result";
import { OutputPanel } from "@/components/composites/views/analyze/output/output-panel";
import { SplitView } from "@/components/composites/views/split-view/split-view";
import { SplitViewPane } from "@/components/composites/views/split-view/split-view-pane";
import { StyledInput } from "@/components/ui/styled-input";
import {
    getJobControllerGetHistoryQueryKey,
    type JobHistoryEntryDto,
    useJobControllerGetHistory,
} from "@/lib/client";

type HistoryEntry = {
    id: string;
    subject: string;
    body: string;
    result: AnalysisResult | null;
};

type HistoryViewProps = {
    history?: HistoryEntry[];
};

type HistoryListItemProps = {
    entry: HistoryEntry;
    isSelected: boolean;
    onSelectAction: (id: string) => void;
};

function HistoryListItem({
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

function filterEntries(entries: HistoryEntry[], query: string) {
    const searchTerm = query.trim().toLowerCase();

    if (!searchTerm) {
        return entries;
    }

    return entries.filter((entry) => {
        return (
            entry.subject.toLowerCase().includes(searchTerm) ||
            entry.body.toLowerCase().includes(searchTerm)
        );
    });
}

export function HistoryView({ history = [] }: HistoryViewProps) {
    const hasProvidedHistory = history.length > 0;
    const historyQuery = useJobControllerGetHistory({
        query: {
            queryKey: getJobControllerGetHistoryQueryKey(),
            enabled: !hasProvidedHistory,
            staleTime: 30_000,
            retry: false,
        },
    });
    const sourceHistory = useMemo(() => {
        if (hasProvidedHistory) {
            return history;
        }

        if (historyQuery.data?.status !== 200) {
            return [];
        }

        return historyQuery.data.data.map(mapHistoryEntryDtoToHistoryEntry);
    }, [hasProvidedHistory, history, historyQuery.data]);

    const [selectedId, setSelectedId] = useState<string | null>(
        sourceHistory[0]?.id ?? null,
    );
    const [query, setQuery] = useState("");

    const filteredHistory = useMemo(
        () => filterEntries(sourceHistory, query),
        [sourceHistory, query],
    );

    useEffect(() => {
        if (filteredHistory.length === 0) {
            setSelectedId(null);
            return;
        }

        if (
            selectedId &&
            filteredHistory.some((item) => item.id === selectedId)
        ) {
            return;
        }

        setSelectedId(filteredHistory[0]?.id ?? null);
    }, [filteredHistory, selectedId]);

    const selectedItem =
        filteredHistory.find((item) => item.id === selectedId) ?? null;

    return (
        <SplitView>
            <SplitViewPane variant="primary" isScrollable>
                <div className="mx-auto flex h-full w-full flex-col">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            History
                        </h2>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            Browse previous analysis runs and inspect their
                            output.
                        </p>
                    </div>

                    <div className="relative mb-4">
                        <Search
                            size={16}
                            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400"
                        />
                        <StyledInput
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search by subject or content"
                            className="pl-9"
                        />
                    </div>

                    <div className="space-y-3">
                        {historyQuery.isLoading && !hasProvidedHistory ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                                Loading history...
                            </div>
                        ) : historyQuery.isError && !hasProvidedHistory ? (
                            <div className="rounded-2xl border border-dashed border-red-300 bg-red-50 p-6 text-sm text-red-600 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
                                Could not load history. Please try again.
                            </div>
                        ) : filteredHistory.length > 0 ? (
                            filteredHistory.map((entry) => (
                                <HistoryListItem
                                    key={entry.id}
                                    entry={entry}
                                    isSelected={entry.id === selectedItem?.id}
                                    onSelectAction={setSelectedId}
                                />
                            ))
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                                No history entries found.
                            </div>
                        )}
                    </div>
                </div>
            </SplitViewPane>

            <SplitViewPane variant="secondary">
                {selectedItem ? (
                    <OutputPanel
                        result={selectedItem.result}
                        isAnalyzing={false}
                        currentStep={4}
                    />
                ) : (
                    <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        <FileJson size={48} className="mb-4 opacity-20" />
                        <p>No history item selected.</p>
                    </div>
                )}
            </SplitViewPane>
        </SplitView>
    );
}

export default HistoryView;

function mapHistoryEntryDtoToHistoryEntry(
    entry: JobHistoryEntryDto,
): HistoryEntry {
    return {
        id: entry.id,
        subject: entry.subject ?? "",
        body: entry.body,
        result: (entry.result ?? null) as AnalysisResult | null,
    };
}
