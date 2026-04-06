"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/components/composites/views/analyze/model/analysis-result";
import { CopyActionButton } from "@/components/composites/views/analyze/output/common/copy-action-button";
import { JsonSyntaxHighlighter } from "@/components/composites/views/analyze/output/common/json-syntax-highlighter";
import { CategorySection } from "@/components/composites/views/analyze/output/result/category-section";
import { ConfidenceSection } from "@/components/composites/views/analyze/output/result/confidence-section";
import { ResultCard } from "@/components/composites/views/analyze/output/result/result-card";
import { ResultSection } from "@/components/composites/views/analyze/output/result/result-section";
import { SummarySection } from "@/components/composites/views/analyze/output/result/summary-section";
import { WorkflowTab } from "@/components/composites/views/analyze/output/workflow-tab";
import { ScrollArea, ScrollBar } from "@/components/primitives/scroll-area";
import {
    StyledTabs,
    StyledTabsContent,
    StyledTabsList,
    StyledTabsTrigger,
} from "@/components/ui/styled-tabs";

type HistoryAnalysisPanelProps = {
    result: AnalysisResult | null;
    rawResult: unknown;
};

export function HistoryAnalysisPanel({
    result,
    rawResult,
}: HistoryAnalysisPanelProps) {
    const [activeTab, setActiveTab] = useState<string>(
        result ? "result" : "raw",
    );
    const renderableResult = result ? withConfidenceFallback(result) : null;
    const rawJson = JSON.stringify(rawResult, null, 2);

    return (
        <StyledTabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex h-full w-full flex-col"
        >
            <StyledTabsList className="mb-8 w-fit">
                {renderableResult ? (
                    <>
                        <StyledTabsTrigger value="result">
                            Result
                        </StyledTabsTrigger>
                        <StyledTabsTrigger value="workflow">
                            Workflow
                        </StyledTabsTrigger>
                    </>
                ) : null}
                <StyledTabsTrigger value="raw">Raw JSON</StyledTabsTrigger>
            </StyledTabsList>

            {renderableResult ? (
                <StyledTabsContent
                    value="result"
                    className="mt-0 w-full flex-1"
                >
                    <div className="space-y-6">
                        <CategorySection result={renderableResult} />
                        <SummarySection result={renderableResult} />
                        <HistoryEmailResponseSection
                            result={renderableResult}
                        />
                        <ConfidenceSection result={renderableResult} />
                    </div>
                </StyledTabsContent>
            ) : null}

            {renderableResult ? (
                <StyledTabsContent
                    value="workflow"
                    className="mt-0 w-full flex-1"
                >
                    <WorkflowTab
                        result={renderableResult}
                        isAnalyzing={false}
                        step={4}
                        staticCompleted
                    />
                </StyledTabsContent>
            ) : null}

            <StyledTabsContent value="raw" className="mt-0 w-full flex-1">
                <ResultSection title="Raw JSON">
                    <ResultCard className="font-mono text-sm">
                        <CopyActionButton
                            title="Copy Raw JSON"
                            copyText={rawJson}
                        />
                        <ScrollArea className="w-full pr-6">
                            <JsonSyntaxHighlighter data={rawResult} />
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </ResultCard>
                </ResultSection>
            </StyledTabsContent>
        </StyledTabs>
    );
}

function HistoryEmailResponseSection({ result }: { result: AnalysisResult }) {
    const responseBody = result.email_response?.response_body;
    if (typeof responseBody !== "string" || responseBody.length === 0) {
        return null;
    }

    return (
        <ResultSection title="Email Response">
            <ResultCard className="text-sm leading-relaxed text-slate-700 whitespace-break-spaces dark:text-slate-300">
                <CopyActionButton
                    title="Copy Email body"
                    copyText={responseBody}
                />
                {responseBody}
            </ResultCard>
        </ResultSection>
    );
}

function withConfidenceFallback(result: AnalysisResult): AnalysisResult {
    const confidence = result.confidence_assessment;

    if (confidence && typeof confidence.rationale === "string") {
        return result;
    }

    return {
        ...result,
        confidence_assessment: {
            rationale:
                "Confidence assessment is not available for this history entry.",
            ...(confidence?.score !== undefined
                ? { score: confidence.score }
                : {}),
        },
    };
}
