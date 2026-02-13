import { Spinner } from "@/components/primitives/spinner";

/**
 * Displays a centralized loading state while dashboard authentication is resolving.
 */
export function DashboardLoadingView() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <Spinner className="size-4" />
                Loading dashboard...
            </div>
        </div>
    );
}
