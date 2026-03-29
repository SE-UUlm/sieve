import type { SubmitEmailResponseDto } from "@/lib/client/models";

/**
 * Structured analysis payload returned by the backend API.
 */
export type AnalysisResult = SubmitEmailResponseDto["data"];

/**
 * Extracts the category labels from the analysis payload.
 *
 * @param result Structured analysis payload from backend.
 * @returns Human-readable category labels.
 */
export function getAnalysisCategories(result: AnalysisResult): string[] {
    return result.category_results.map((x) => x.category);
}

/**
 * Builds a short summary for the current analysis payload.
 *
 * @param result Structured analysis payload from backend.
 * @returns A concise summary string for display.
 */
export function getAnalysisSummary(result: AnalysisResult): string {
    const summaries = result.category_results.map((x) => x.steps.summary);

    if (summaries.length === 0) return "No matching categories found.";

    return summaries.join("\n");
}
