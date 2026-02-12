import React from "react";
import { Label } from "@/components/primitives/label";
import { cn } from "@/lib/utils/shadcn-helper";

export const StyledLabel = React.forwardRef<
    React.ComponentRef<typeof Label>,
    React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
    return (
        <Label
            ref={ref}
            className={cn(
                "text-sm font-medium text-slate-500 dark:text-slate-400",
                className,
            )}
            {...props}
        />
    );
});
StyledLabel.displayName = "StyledLabel";
