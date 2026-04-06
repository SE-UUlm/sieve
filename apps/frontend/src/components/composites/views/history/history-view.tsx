"use client";

import { FileJson, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AnalysisResult } from "@/components/composites/views/analyze/model/analysis-result";
import { SplitView } from "@/components/composites/views/split-view/split-view";
import { SplitViewPane } from "@/components/composites/views/split-view/split-view-pane";
import { StyledInput } from "@/components/ui/styled-input";
import {
    getJobControllerGetHistoryQueryKey,
    type JobHistoryEntryDto,
    useJobControllerGetHistory,
} from "@/lib/client";
import { showPersistentErrorToast } from "@/lib/toast";
import { HistoryAnalysisPanel } from "./history-analysis-panel";
import { HistoryListItem } from "./history-list-item";

type HistoryEntry = {
    id: string;
    subject: string;
    body: string;
    result: AnalysisResult | null;
    rawResult?: unknown | null;
};

type HistoryViewProps = {
    history?: HistoryEntry[];
};

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

    useEffect(() => {
        if (historyQuery.isError && !hasProvidedHistory) {
            showPersistentErrorToast({
                title: "Failed to Load History",
                description: "Could not load history. Please try again later.",
            });
        }
    }, [historyQuery.isError, hasProvidedHistory]);

    const selectedItem =
        filteredHistory.find((item) => item.id === selectedId) ?? null;
    const selectedRawResult = selectedItem?.rawResult ?? selectedItem?.result;

    return (
        <SplitView resizable>
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
                            aria-label="Search history"
                        />
                    </div>

                    <div className="space-y-3">
                        {historyQuery.isLoading && !hasProvidedHistory ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                                Loading history...
                            </div>
                        ) : historyQuery.isError && !hasProvidedHistory ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                                Failed to load history.
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

            <SplitViewPane variant="secondary" isScrollable>
                {selectedItem ? (
                    <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-4">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
                            <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                Email
                            </h3>
                            <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">
                                {selectedItem.subject || "Untitled mail"}
                            </h2>
                            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                                {selectedItem.body}
                            </p>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
                            <h3 className="text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                                Analysis Result
                            </h3>
                            {selectedRawResult != null ? (
                                <div className="mt-3">
                                    <HistoryAnalysisPanel
                                        key={selectedItem.id}
                                        result={selectedItem.result}
                                        rawResult={selectedRawResult}
                                    />
                                </div>
                            ) : (
                                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                                    No analysis result available for this entry.
                                </p>
                            )}
                        </section>
                    </div>
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
        result: toHistoryAnalysisResult(entry.result),
        rawResult: entry.result ?? null,
    };
}

function toHistoryAnalysisResult(
    result: JobHistoryEntryDto["result"],
): AnalysisResult | null {
    if (!result) {
        return null;
    }

    if (!Array.isArray(result.category_results)) {
        return null;
    }

    return result as AnalysisResult;
}
