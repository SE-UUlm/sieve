"use client";

import { FileJson, Search, Mail, Inbox } from "lucide-react";
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
import { cn } from "@/lib/utils/shadcn-helper";
import { HistoryListItem } from "./history-list-item";

type EmailSource = "MANUAL" | "IMAP";

type HistoryEntry = {
    id: string;
    subject: string;
    body: string;
    result: AnalysisResult | null;
    rawResult?: unknown | null;
    source: EmailSource;
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
    const [selectedSource, setSelectedSource] = useState<EmailSource | "ALL">("ALL");
    
    const hasProvidedHistory = history.length > 0;
    
    // Fetch all history
    const allHistoryQuery = useJobControllerGetHistory(
        {},
        {
            query: {
                queryKey: getJobControllerGetHistoryQueryKey({}),
                enabled: !hasProvidedHistory,
                staleTime: 30_000,
                retry: false,
            },
        },
    );

    // Fetch manual history
    const manualHistoryQuery = useJobControllerGetHistory(
        { source: "MANUAL" },
        {
            query: {
                queryKey: getJobControllerGetHistoryQueryKey({ source: "MANUAL" }),
                enabled: !hasProvidedHistory && selectedSource === "MANUAL",
                staleTime: 30_000,
                retry: false,
            },
        },
    );

    // Fetch IMAP history
    const imapHistoryQuery = useJobControllerGetHistory(
        { source: "IMAP" },
        {
            query: {
                queryKey: getJobControllerGetHistoryQueryKey({ source: "IMAP" }),
                enabled: !hasProvidedHistory && selectedSource === "IMAP",
                staleTime: 30_000,
                retry: false,
            },
        },
    );

    const currentQuery = useMemo(() => {
        if (selectedSource === "MANUAL") return manualHistoryQuery;
        if (selectedSource === "IMAP") return imapHistoryQuery;
        return allHistoryQuery;
    }, [selectedSource, allHistoryQuery, manualHistoryQuery, imapHistoryQuery]);

    const sourceHistory = useMemo(() => {
        if (hasProvidedHistory) {
            return history.filter(
                (entry) => selectedSource === "ALL" || entry.source === selectedSource
            );
        }

        if (currentQuery.data?.status !== 200) {
            return [];
        }

        return currentQuery.data.data.map(mapHistoryEntryDtoToHistoryEntry);
    }, [hasProvidedHistory, history, currentQuery.data, selectedSource]);

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
        if (currentQuery.isError && !hasProvidedHistory) {
            showPersistentErrorToast({
                title: "Failed to Load History",
                description: "Could not load history. Please try again later.",
            });
        }
    }, [currentQuery.isError, hasProvidedHistory]);

    const selectedItem =
        filteredHistory.find((item) => item.id === selectedId) ?? null;
    const selectedRawResult = selectedItem?.rawResult ?? selectedItem?.result;

    const tabConfig: { key: EmailSource | "ALL"; label: string; icon: typeof Mail; count?: number }[] = [
        { key: "ALL", label: "All", icon: Mail },
        { key: "MANUAL", label: "Manual", icon: Mail },
        { key: "IMAP", label: "IMAP", icon: Inbox },
    ];

    const isLoading = currentQuery.isLoading && !hasProvidedHistory;
    const isError = currentQuery.isError && !hasProvidedHistory;

    return (
        <SplitView resizable>
            <SplitViewPane variant="primary" isScrollable>
                <div className="mx-auto flex h-full w-full flex-col">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            History
                        </h2>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            Browse previous analysis runs and inspect their output.
                        </p>
                    </div>

                    {/* Source Tabs */}
                    <div className="mb-6 flex gap-2">
                        {tabConfig.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = selectedSource === tab.key;
                            
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setSelectedSource(tab.key)}
                                    className={cn(
                                        "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-blue-600 text-white"
                                            : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
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
                        {isLoading ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                                Loading history...
                            </div>
                        ) : isError ? (
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
                                No history entries found for this category.
                            </div>
                        )}
                    </div>
                </div>
            </SplitViewPane>

            <SplitViewPane variant="secondary" isScrollable>
                {selectedItem ? (
                    <div className="mx-auto flex min-h-full w-full flex-col gap-4">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
                            <div className="mb-4 flex items-center gap-2">
                                {selectedItem.source === "IMAP" ? (
                                    <Inbox className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                                ) : (
                                    <Mail className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                                )}
                                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    {selectedItem.source === "IMAP" ? "IMAP Import" : "Manual Entry"}
                                </span>
                            </div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
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
        source: entry.source ?? "MANUAL",
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
