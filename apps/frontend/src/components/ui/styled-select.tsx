import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/primitives/select";
import { cn } from "@/lib/utils/shadcn-helper";

export const StyledSelect = Select;

export const StyledSelectTrigger = React.forwardRef<
    React.ComponentRef<typeof SelectTrigger>,
    React.ComponentPropsWithoutRef<typeof SelectTrigger>
>(({ className, ...props }, ref) => (
    <SelectTrigger
        ref={ref}
        className={cn(
            "h-11 w-full border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
            "focus:ring-blue-500/20",
            className,
        )}
        {...props}
    />
));
StyledSelectTrigger.displayName = "StyledSelectTrigger";

export const StyledSelectContent = SelectContent;

export const StyledSelectItem = SelectItem;

export const StyledSelectValue = SelectValue;
