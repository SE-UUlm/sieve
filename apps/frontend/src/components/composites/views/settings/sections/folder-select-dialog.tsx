"use client";

import { useState } from "react";
import { FolderOpen, Loader2 } from "lucide-react";

type FolderSelectDialogProps = {
    folders: string[];
    isLoading?: boolean;
    onSelect: (folder: string) => void;
    onCancel: () => void;
};

export function FolderSelectDialog({
    folders,
    isLoading,
    onSelect,
    onCancel,
}: FolderSelectDialogProps) {
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                        <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Select Inbox Folder
                    </h3>
                </div>

                <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                    Choose the folder that contains incoming emails to process.
                </p>

                {isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm">Loading folders...</span>
                    </div>
                ) : (
                    <div className="mb-6 max-h-60 overflow-y-auto space-y-1">
                        {folders.map((folder) => (
                            <button
                                key={folder}
                                type="button"
                                onClick={() => setSelectedFolder(folder)}
                                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                    selectedFolder === folder
                                        ? "bg-blue-600 text-white"
                                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                                }`}
                            >
                                {folder}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => selectedFolder && onSelect(selectedFolder)}
                        disabled={!selectedFolder}
                        className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
