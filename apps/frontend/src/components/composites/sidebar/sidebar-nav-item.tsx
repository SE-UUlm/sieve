import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type SidebarNavItemProps = {
    icon: LucideIcon;
    label: string;
    isActive: boolean;
    href: string;
};

export function SidebarNavItem({
    icon: Icon,
    label,
    isActive,
    href,
}: SidebarNavItemProps) {
    return (
        <Link
            href={href}
            className={`group relative flex w-full justify-center py-3 transition-all duration-200 ${
                isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-300"
            }`}
            title={label}
        >
            {isActive && (
                <div className="absolute top-1/2 left-0 h-8 w-1 -translate-y-1/2 rounded-r-full bg-blue-500" />
            )}
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        </Link>
    );
}
