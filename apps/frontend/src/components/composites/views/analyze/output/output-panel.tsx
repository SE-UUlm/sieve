import { useEffect, useState } from "react";
import { ResultTab } from "@/components/composites/views/analyze/output/result-tab";
import { WorkflowTab } from "@/components/composites/views/analyze/output/workflow-tab";
import {
    StyledTabs,
    StyledTabsContent,
    StyledTabsList,
    StyledTabsTrigger,
} from "@/components/ui/styled-tabs";
import type { AnalysisResult } from "../model/analysis-result";

type OutputPanelProps = {
    result: AnalysisResult | null;
    isAnalyzing: boolean;
    currentStep: number;
};

/**
 * Renders the result and workflow tabs for a submitted analysis.
 */
export function OutputPanel({
    result,
    isAnalyzing,
    currentStep,
}: OutputPanelProps) {
    const [activeTab, setActiveTab] = useState<string>("result");

    useEffect(() => {
        if (isAnalyzing) {
            setActiveTab("workflow");
        }
    }, [isAnalyzing]);

    return (
        <div className="mx-auto flex h-full w-full max-w-md flex-col">
            <StyledTabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex h-full w-full flex-col items-center"
            >
                <StyledTabsList className="mb-12">
                    <StyledTabsTrigger value="result">Result</StyledTabsTrigger>
                    <StyledTabsTrigger value="workflow">
                        Workflow
                    </StyledTabsTrigger>
                </StyledTabsList>

                <StyledTabsContent
                    value="result"
                    className="mt-0 w-full flex-1 outline-none"
                >
                    <ResultTab result={result} />
                </StyledTabsContent>

                <StyledTabsContent
                    value="workflow"
                    className="mt-0 w-full flex-1 outline-none"
                >
                    <WorkflowTab
                        result={result}
                        isAnalyzing={isAnalyzing}
                        step={currentStep}
                    />
                </StyledTabsContent>
            </StyledTabs>
        </div>
    );
}
