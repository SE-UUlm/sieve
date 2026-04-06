"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Inbox, Loader2 } from "lucide-react";
import {
    useImapControllerGetInboxEmails,
    getImapControllerGetInboxEmailsQueryKey,
    useImapControllerAnalyzeSelected,
} from "@/lib/client/imap/imap";
import { getJobControllerGetHistoryQueryKey } from "@/lib/client/jobs/jobs";
import { showPersistentErrorToast, showSuccessToast } from "@/lib/toast";
import type { InboxEmailDto } from "@/lib/client/models/inboxEmailDto";

export function ImapView() {
    const [selectedUids, setSelectedUids] = useState<Set<number>>(new Set());
    const queryClient = useQueryClient();

    const { data, isLoading, isError, refetch } = useImapControllerGetInboxEmails({
        query: {
            queryKey: getImapControllerGetInboxEmailsQueryKey(),
            staleTime: 30_000,
        },
    });

    const analyzeSelected = useImapControllerAnalyzeSelected({
        mutation: {
            onSuccess: (response) => {
                if (response.status === 200) {
                    const count = response.data.processedCount;
                    showSuccessToast({
                        title: "Analysis complete",
                        description: `${count} email${count === 1 ? "" : "s"} processed successfully.`,
                    });
                    setSelectedUids(new Set());
                    queryClient.invalidateQueries({
                        queryKey: getImapControllerGetInboxEmailsQueryKey(),
                    });
                    queryClient.invalidateQueries({
                        queryKey: getJobControllerGetHistoryQueryKey({ source: "IMAP" }),
                    });
                }
            },
            onError: () => {
                showPersistentErrorToast({
                    title: "Analysis failed",
                    description: "Could not process the selected emails.",
                });
            },
        },
    });

    const emails: InboxEmailDto[] = data?.data?.emails ?? [];
    const allSelected = emails.length > 0 && emails.every((e) => selectedUids.has(e.uid));

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedUids(new Set());
        } else {
            setSelectedUids(new Set(emails.map((e) => e.uid)));
        }
    };

    const toggleEmail = (uid: number) => {
        setSelectedUids((prev) => {
            const next = new Set(prev);
            if (next.has(uid)) {
                next.delete(uid);
            } else {
                next.add(uid);
            }
            return next;
        });
    };

    const handleAnalyze = () => {
        if (selectedUids.size === 0) return;
        analyzeSelected.mutate({ data: { uids: Array.from(selectedUids) } });
    };

    const formatDate = (iso: string | null | undefined) => {
        if (!iso) return "";
        try {
            return new Date(iso).toLocaleDateString(undefined, {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch {
            return "";
        }
    };

    return (
        <div className="flex h-full flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Inbox className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                            IMAP Inbox
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Select emails to analyze and move to processed folder
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={selectedUids.size === 0 || analyzeSelected.isPending}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {analyzeSelected.isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        `Analyze${selectedUids.size > 0 ? ` (${selectedUids.size})` : ""}`
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-16 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
                            />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400">
                        <p className="text-sm">Failed to load inbox emails.</p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="text-sm text-blue-600 underline hover:text-blue-500 dark:text-blue-400"
                        >
                            Try again
                        </button>
                    </div>
                ) : emails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400 dark:text-slate-500">
                        <Inbox className="h-10 w-10 opacity-40" />
                        <p className="text-sm">No emails in inbox.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Select All row */}
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={toggleSelectAll}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600"
                            />
                            <span>Select all ({emails.length})</span>
                        </label>

                        <div className="space-y-2">
                            {emails.map((email) => (
                                <InboxEmailRow
                                    key={email.uid}
                                    email={email}
                                    isSelected={selectedUids.has(email.uid)}
                                    onToggle={toggleEmail}
                                    formatDate={formatDate}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

type InboxEmailRowProps = {
    email: InboxEmailDto;
    isSelected: boolean;
    onToggle: (uid: number) => void;
    formatDate: (iso: string | null | undefined) => string;
};

function InboxEmailRow({ email, isSelected, onToggle, formatDate }: InboxEmailRowProps) {
    return (
        <label
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors ${
                isSelected
                    ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900"
            }`}
        >
            <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(email.uid)}
                className="h-4 w-4 shrink-0 rounded border-slate-300 accent-blue-600"
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {email.subject || "(no subject)"}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                        {formatDate(email.date)}
                    </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {email.sender || "Unknown sender"}
                </p>
            </div>
        </label>
    );
}
