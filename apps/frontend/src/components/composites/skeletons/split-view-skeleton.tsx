import type React from "react";
import { SplitView } from "@/components/composites/views/split-view/split-view";
import { SplitViewPane } from "@/components/composites/views/split-view/split-view-pane";

type SplitViewSkeletonProps = {
    primaryContent: React.ReactNode;
    secondaryContent: React.ReactNode;
    secondaryScrollable?: boolean;
};

export function SplitViewSkeleton({
    primaryContent,
    secondaryContent,
    secondaryScrollable = true,
}: SplitViewSkeletonProps) {
    return (
        <SplitView>
            <SplitViewPane variant="primary">{primaryContent}</SplitViewPane>
            <SplitViewPane
                variant="secondary"
                isScrollable={secondaryScrollable}
                className="min-h-full"
            >
                {secondaryContent}
            </SplitViewPane>
        </SplitView>
    );
}
