import React from "react";
import { Button } from "@/components/primitives/button";
import { Spinner } from "@/components/primitives/spinner";
import { cn } from "@/lib/utils/shadcn-helper";

type StyledButtonProps = React.ComponentPropsWithoutRef<typeof Button> & {
    isLoading?: boolean;
    label: string;
    loadingLabel: string;
};

export const StyledButton = React.forwardRef<
    React.ComponentRef<typeof Button>,
    StyledButtonProps
>(({ className, isLoading, disabled, ...props }, ref) => {
    return (
        <Button
            ref={ref}
            disabled={isLoading || disabled}
            className={cn(
                "h-14 w-full rounded-lg text-base transition-all duration-200",
                "bg-blue-600 text-white hover:bg-blue-500",
                "shadow-xl shadow-blue-900/20",
                "disabled:cursor-not-allowed disabled:bg-blue-600/50",
                className,
            )}
            {...props}
        >
            {isLoading && <Spinner className="size-4" />}
            {isLoading ? props.loadingLabel : props.label}
        </Button>
    );
});
StyledButton.displayName = "StyledButton";
