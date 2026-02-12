import { cn } from "@/lib/utils/shadcn-helper";

type SplitViewPaneProps = React.HTMLAttributes<HTMLDivElement> & {
    variant?: "primary" | "secondary";
    isScrollable?: boolean;
};

export function SplitViewPane({
    variant = "primary",
    isScrollable = false,
    children,
    className = "",
    ...props
}: SplitViewPaneProps) {
    const baseClasses =
        "flex-1 min-w-0 p-8 md:p-12 transition-colors duration-300";

    const variantClasses =
        variant === "primary"
            ? "bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-900"
            : "bg-slate-50 dark:bg-[#0a0f1e]";
    const layoutClasses = isScrollable ? "overflow-y-auto" : "flex flex-col";

    return (
        <div
            className={cn(
                baseClasses,
                variantClasses,
                layoutClasses,
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}
