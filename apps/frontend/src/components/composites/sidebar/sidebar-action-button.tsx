import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/shadcn-helper";

type SidebarActionButtonProps = {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    className?: string;
};

export function SidebarActionButton({
    icon: Icon,
    label,
    onClick,
    className = "",
}: SidebarActionButtonProps) {
    return (
        <button
            onClick={onClick}
            type="button"
            className={cn(
                "p-3 text-slate-400 transition-colors dark:text-slate-500",
                className,
            )}
            title={label}
            aria-label={label}
        >
            <Icon size={24} />
        </button>
    );
}
