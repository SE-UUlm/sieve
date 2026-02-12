import React from "react";
import { Textarea } from "@/components/primitives/textarea";
import { cn } from "@/lib/utils/shadcn-helper";

export const StyledTextarea = React.forwardRef<
    React.ComponentRef<typeof Textarea>,
    React.ComponentPropsWithoutRef<typeof Textarea>
>(({ className, ...props }, ref) => {
    return (
        <Textarea
            ref={ref}
            className={cn(
                "resize-none rounded-xl p-6 font-mono text-sm leading-relaxed",
                "bg-slate-100/50 dark:bg-slate-900/30",
                "border-slate-200 dark:border-slate-800",
                "placeholder:text-slate-400 dark:placeholder:text-slate-600",
                "focus-visible:border-blue-500/50 focus-visible:ring-2 focus-visible:ring-blue-500/20",
                className,
            )}
            {...props}
        />
    );
});
StyledTextarea.displayName = "StyledTextarea";
