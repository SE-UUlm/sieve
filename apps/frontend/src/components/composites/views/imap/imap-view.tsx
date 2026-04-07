"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Calendar, FileJson, Inbox, Loader2, User } from "lucide-react";
import { useState } from "react";
import { SplitView } from "@/components/composites/views/split-view/split-view";
import { SplitViewPane } from "@/components/composites/views/split-view/split-view-pane";
import { StyledButton } from "@/components/ui/styled-button";
import { StyledSkeleton } from "@/components/ui/styled-skeleton";
import {
    getImapControllerGetEmailBodyQueryKey,
    getImapControllerGetInboxEmailsQueryKey,
    type imapControllerGetInboxEmailsResponseSuccess,
    useImapControllerAnalyzeSelected,
    useImapControllerGetEmailBody,
    useImapControllerGetInboxEmails,
} from "@/lib/client/imap/imap";
import { getJobControllerGetHistoryQueryKey } from "@/lib/client/jobs/jobs";
import type { InboxEmailDto } from "@/lib/client/models/inboxEmailDto";
import { showPersistentErrorToast, showSuccessToast } from "@/lib/toast";

export function ImapView() {
    const [selectedUids, setSelectedUids] = useState<Set<number>>(new Set());
    const [previewUid, setPreviewUid] = useState<number | null>(null);
    const queryClient = useQueryClient();

    const { data, isLoading, isError, refetch } =
        useImapControllerGetInboxEmails({
            query: {
                queryKey: getImapControllerGetInboxEmailsQueryKey(),
                staleTime: 30_000,
            },
        });

    const { data: bodyData, isLoading: isBodyLoading } =
        useImapControllerGetEmailBody(previewUid ?? 0, {
            query: {
                queryKey: getImapControllerGetEmailBodyQueryKey(
                    previewUid ?? 0,
                ),
                enabled: previewUid !== null,
                staleTime: 60_000,
            },
        });

    const analyzeSelected = useImapControllerAnalyzeSelected({
        mutation: {
            onMutate: async ({ data: { uids } }) => {
                await queryClient.cancelQueries({
                    queryKey: getImapControllerGetInboxEmailsQueryKey(),
                });
                const previousData =
                    queryClient.getQueryData<imapControllerGetInboxEmailsResponseSuccess>(
                        getImapControllerGetInboxEmailsQueryKey(),
                    );
                queryClient.setQueryData<imapControllerGetInboxEmailsResponseSuccess>(
                    getImapControllerGetInboxEmailsQueryKey(),
                    (old) => {
                        if (!old?.data?.emails) return old;
                        return {
                            ...old,
                            data: {
                                ...old.data,
                                emails: old.data.emails.filter(
                                    (email) => !uids.includes(email.uid),
                                ),
                            },
                        };
                    },
                );
                return { previousData };
            },
            onSuccess: (response) => {
                if (response.status === 200) {
                    const count = response.data.processedCount;
                    showSuccessToast({
                        title: "Analysis complete",
                        description: `${count} email${count === 1 ? "" : "s"} processed successfully.`,
                    });
                    setSelectedUids(new Set());
                    setPreviewUid(null);
                    queryClient.invalidateQueries({
                        queryKey: getJobControllerGetHistoryQueryKey({
                            source: "IMAP",
                        }),
                    });
                    queryClient.invalidateQueries({
                        queryKey: getJobControllerGetHistoryQueryKey({}),
                    });
                }
            },
            onError: (_error, _variables, context) => {
                if (context?.previousData !== undefined) {
                    queryClient.setQueryData(
                        getImapControllerGetInboxEmailsQueryKey(),
                        context.previousData,
                    );
                }
                showPersistentErrorToast({
                    title: "Analysis failed",
                    description: "Could not process the selected emails.",
                });
            },
            onSettled: () => {
                queryClient.invalidateQueries({
                    queryKey: getImapControllerGetInboxEmailsQueryKey(),
                });
            },
        },
    });

    const emails: InboxEmailDto[] = data?.data?.emails ?? [];
    const allSelected =
        emails.length > 0 && emails.every((e) => selectedUids.has(e.uid));
    const previewEmail = emails.find((e) => e.uid === previewUid) ?? null;

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
        <SplitView>
            <SplitViewPane variant="primary">
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="mb-8 shrink-0">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            IMAP Inbox
                        </h2>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            Select emails to analyze and move to processed
                            folder.
                        </p>
                    </div>

                    {/* Email list — scrollable */}
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="space-y-3">
                                {["sk-0", "sk-1", "sk-2", "sk-3", "sk-4"].map(
                                    (id) => (
                                        <StyledSkeleton
                                            key={id}
                                            className="h-16 w-full rounded-2xl"
                                        />
                                    ),
                                )}
                            </div>
                        ) : isError ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500 dark:text-slate-400">
                                <p className="text-sm">
                                    Failed to load inbox emails.
                                </p>
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
                                            isSelected={selectedUids.has(
                                                email.uid,
                                            )}
                                            isActive={previewUid === email.uid}
                                            onToggle={toggleEmail}
                                            onSelect={setPreviewUid}
                                            formatDate={formatDate}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Analyze button — pinned to bottom */}
                    <div className="mt-4 shrink-0 border-t border-slate-200 pt-4 dark:border-slate-800">
                        <StyledButton
                            sizeVariant="small"
                            label={`Analyze${selectedUids.size > 0 ? ` (${selectedUids.size})` : ""}`}
                            loadingLabel="Analyzing..."
                            isLoading={analyzeSelected.isPending}
                            disabled={selectedUids.size === 0}
                            onClick={handleAnalyze}
                        />
                    </div>
                </div>
            </SplitViewPane>

            <SplitViewPane variant="secondary" isScrollable>
                {previewEmail ? (
                    <EmailPreview
                        email={previewEmail}
                        body={
                            bodyData?.status === 200
                                ? bodyData.data.body
                                : undefined
                        }
                        isLoadingBody={isBodyLoading}
                        formatDate={formatDate}
                    />
                ) : (
                    <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        <FileJson size={48} className="mb-4 opacity-20" />
                        <p>Select an email to preview.</p>
                    </div>
                )}
            </SplitViewPane>
        </SplitView>
    );
}

type InboxEmailRowProps = {
    email: InboxEmailDto;
    isSelected: boolean;
    isActive: boolean;
    onToggle: (uid: number) => void;
    onSelect: (uid: number) => void;
    formatDate: (iso: string | null | undefined) => string;
};

function InboxEmailRow({
    email,
    isSelected,
    isActive,
    onToggle,
    onSelect,
    formatDate,
}: InboxEmailRowProps) {
    return (
        <div
            className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors ${
                isActive
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
            <button
                type="button"
                onClick={() => onSelect(email.uid)}
                className="min-w-0 flex-1 cursor-pointer text-left"
            >
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
            </button>
        </div>
    );
}

type EmailPreviewProps = {
    email: InboxEmailDto;
    body: string | undefined;
    isLoadingBody: boolean;
    formatDate: (iso: string | null | undefined) => string;
};

function EmailPreview({
    email,
    body,
    isLoadingBody,
    formatDate,
}: EmailPreviewProps) {
    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="mb-4 flex items-center gap-2">
                    <Inbox className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        IMAP Inbox
                    </span>
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {email.subject || "(no subject)"}
                </h2>
                <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <User className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>{email.sender || "Unknown sender"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>{formatDate(email.date) || "Unknown date"}</span>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Body
                </h3>
                {isLoadingBody ? (
                    <div className="mt-3 flex items-center gap-2 text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading body...</span>
                    </div>
                ) : body ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                        {body}
                    </p>
                ) : (
                    <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
                        No body content available.
                    </p>
                )}
            </section>
        </div>
    );
}
