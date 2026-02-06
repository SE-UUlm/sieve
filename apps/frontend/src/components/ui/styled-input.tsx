import React from "react";
import { Input } from "@/components/primitives/input";
import { cn } from "@/lib/utils/shadcn-helper";

export const StyledInput = React.forwardRef<
    React.ComponentRef<typeof Input>,
    React.ComponentPropsWithoutRef<typeof Input>
>(({ className, ...props }, ref) => {
    return (
        <Input
            ref={ref}
            className={cn(
                "h-11 px-4 py-2",
                "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
                "text-slate-900 dark:text-slate-200",
                "focus-visible:border-blue-500/50 focus-visible:ring-2 focus-visible:ring-blue-500/20",
                "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                className,
            )}
            {...props}
        />
    );
});
StyledInput.displayName = "StyledInput";
