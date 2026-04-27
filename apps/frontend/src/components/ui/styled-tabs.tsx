import React from "react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/primitives/tabs";
import { cn } from "@/lib/utils/shadcn-helper";

export const StyledTabs = Tabs;

export const StyledTabsList = React.forwardRef<
    React.ComponentRef<typeof TabsList>,
    React.ComponentPropsWithoutRef<typeof TabsList>
>(({ className, ...props }, ref) => (
    <TabsList
        ref={ref}
        className={cn(
            "h-14! items-center gap-1 rounded-lg border border-slate-300 bg-slate-200/50 p-1 dark:border-slate-800 dark:bg-slate-900/50",
            className,
        )}
        {...props}
    />
));
StyledTabsList.displayName = "StyledTabsList";

export const StyledTabsTrigger = React.forwardRef<
    React.ComponentRef<typeof TabsTrigger>,
    React.ComponentPropsWithoutRef<typeof TabsTrigger>
>(({ className, ...props }, ref) => (
    <TabsTrigger
        ref={ref}
        className={cn(
            // Base Layout
            "h-11! flex-none rounded-md px-6 py-1 text-sm font-medium transition-all",
            // Inactive State
            "text-slate-500 border-none hover:text-slate-700 dark:hover:text-slate-300",
            // Active State (Background & Text)
            "data-[state=active]:bg-white data-[state=active]:dark:bg-slate-800!",
            "data-[state=active]:text-slate-900 data-[state=active]:dark:text-white",
            // Active State (Borders & Shadow)
            "data-[state=active]:shadow-sm",
            className,
        )}
        {...props}
    />
));
StyledTabsTrigger.displayName = "StyledTabsTrigger";

export const StyledTabsContent = TabsContent;
