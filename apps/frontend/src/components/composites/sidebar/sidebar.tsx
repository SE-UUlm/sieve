import { History, Inbox, LogOut, MailSearch, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/composites/logo";
import { SidebarActionButton } from "@/components/composites/sidebar/sidebar-action-button";
import { SidebarNavItem } from "@/components/composites/sidebar/sidebar-nav-item";
import { ThemeToggleButton } from "@/components/composites/theme/theme-toggle-button";

type SidebarProps = {
    onLogout: () => void;
};

export function Sidebar({ onLogout }: SidebarProps) {
    const pathname = usePathname();

    const navItems = [
        { href: "/analyze", icon: MailSearch, label: "Analyze" },
        { href: "/imap", icon: Inbox, label: "IMAP" },
        { href: "/history", icon: History, label: "History" },
        { href: "/settings", icon: Settings, label: "Settings" },
    ];

    return (
        <div className="flex h-screen w-16 shrink-0 flex-col items-center border-r border-slate-200 bg-white py-6 transition-colors duration-300 md:w-20 dark:border-slate-800 dark:bg-slate-900">
            <Logo />

            <nav className="flex w-full flex-1 flex-col gap-6">
                {navItems.map((item) => (
                    <SidebarNavItem
                        key={item.href}
                        icon={item.icon}
                        label={item.label}
                        isActive={pathname === item.href}
                        href={item.href}
                    />
                ))}
            </nav>

            <div className="mt-auto mb-2 flex flex-col items-center gap-4">
                <ThemeToggleButton className="hover:text-blue-600 dark:hover:text-yellow-400" />

                <SidebarActionButton
                    icon={LogOut}
                    label="Logout"
                    onClick={onLogout}
                    className="hover:text-red-600 dark:hover:text-red-400"
                />
            </div>
        </div>
    );
}
