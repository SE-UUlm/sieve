import type React from "react";

type SettingsSectionProps = {
    title: string;
    description?: string;
    children: React.ReactNode;
};

export function SettingsSection({
    title,
    description,
    children,
}: SettingsSectionProps) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <header className="mb-6 space-y-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {title}
                </h3>
                {description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {description}
                    </p>
                )}
            </header>
            {children}
        </section>
    );
}
