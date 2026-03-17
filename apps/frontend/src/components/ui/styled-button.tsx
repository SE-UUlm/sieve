import React from "react";
import { Button } from "@/components/primitives/button";
import { Spinner } from "@/components/primitives/spinner";
import { cn } from "@/lib/utils/shadcn-helper";

type StyledButtonProps = React.ComponentPropsWithoutRef<typeof Button> & {
    isLoading?: boolean;
    label: string;
    loadingLabel: string;
    sizeVariant: "small" | "medium" | "large";
};

export const StyledButton = React.forwardRef<
    React.ComponentRef<typeof Button>,
    StyledButtonProps
>(({ className, disabled, isLoading, sizeVariant, ...props }, ref) => {
    const sizeClasses =
        sizeVariant === "small"
            ? "h-9 px-4 py-2 text-sm"
            : sizeVariant === "medium"
              ? "h-12 px-6 py-2.5 text-base"
              : "h-14 px-8 py-3 text-base";
    const finalDisabled = isLoading || disabled;

    return (
        <Button
            ref={ref}
            {...props}
            disabled={finalDisabled}
            className={cn(
                "w-full transition-all duration-200",
                "bg-blue-600 text-white hover:bg-blue-500 rounded-lg",
                "shadow-xl shadow-blue-900/20",
                "disabled:cursor-not-allowed disabled:bg-blue-600/50",
                sizeClasses,
                className,
            )}
        >
            {isLoading && <Spinner className="size-4" />}
            {isLoading ? props.loadingLabel : props.label}
        </Button>
    );
});
StyledButton.displayName = "StyledButton";
