"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminProviderSection } from "@/components/composites/views/settings/sections/admin-provider-section";
import { UserProfileSection } from "@/components/composites/views/settings/sections/user-profile-section";
import { UserSecuritySection } from "@/components/composites/views/settings/sections/user-security-section";
import { SplitView } from "@/components/composites/views/split-view/split-view";
import { SplitViewPane } from "@/components/composites/views/split-view/split-view-pane";
import { authClient } from "@/lib/auth-client";

type SettingsSectionKey = "profile" | "security" | "provider";

export function SettingsView() {
    const { data: session } = authClient.useSession();
    const isAdmin = useMemo(
        () =>
            (session?.user as { role?: string } | undefined)?.role === "ADMIN",
        [session?.user],
    );
    const [selectedSection, setSelectedSection] =
        useState<SettingsSectionKey>("profile");

    const sections = useMemo(
        () =>
            [
                {
                    key: "profile" as const,
                    title: "Profile",
                    description: "Update your display name and email address.",
                },
                {
                    key: "security" as const,
                    title: "Security",
                    description: "Change your account password.",
                },
                ...(isAdmin
                    ? [
                          {
                              key: "provider" as const,
                              title: "Provider",
                              description:
                                  "Configure the instance-wide AI provider key.",
                          },
                      ]
                    : []),
            ] satisfies ReadonlyArray<{
                key: SettingsSectionKey;
                title: string;
                description: string;
            }>,
        [isAdmin],
    );

    useEffect(() => {
        if (sections.some((section) => section.key === selectedSection)) {
            return;
        }
        setSelectedSection(sections[0]?.key ?? "profile");
    }, [sections, selectedSection]);

    return (
        <SplitView>
            <SplitViewPane variant="primary" isScrollable>
                <div className="mx-auto flex h-full w-full flex-col">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Settings
                        </h2>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            Manage your account and workspace configuration.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {sections.map((section) => {
                            const isSelected = selectedSection === section.key;

                            return (
                                <button
                                    key={section.key}
                                    type="button"
                                    onClick={() =>
                                        setSelectedSection(section.key)
                                    }
                                    className={`w-full rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                                        isSelected
                                            ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                                            : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900"
                                    }`}
                                >
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                        {section.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                        {section.description}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </SplitViewPane>

            <SplitViewPane variant="secondary" isScrollable>
                <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-8">
                    {selectedSection === "profile" && <UserProfileSection />}
                    {selectedSection === "security" && <UserSecuritySection />}
                    {selectedSection === "provider" && isAdmin && (
                        <AdminProviderSection />
                    )}
                </div>
            </SplitViewPane>
        </SplitView>
    );
}
