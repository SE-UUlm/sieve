import { StyledSkeleton } from "@/components/ui/styled-skeleton";
import { FormSkeleton } from "./form-skeleton";

type CenteredFormViewSkeletonProps = {
    fieldCount?: number;
};

export function CenteredFormViewSkeleton({
    fieldCount = 2,
}: CenteredFormViewSkeletonProps) {
    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4">
            <div className="absolute top-6 right-6">
                <StyledSkeleton className="size-10 rounded-xl" />
            </div>

            <div className="w-full max-w-md space-y-8">
                <div className="mx-auto h-12 w-40">
                    <StyledSkeleton className="h-full w-full" />
                </div>
                <FormSkeleton fieldCount={fieldCount} includeHeader />
            </div>
        </div>
    );
}
