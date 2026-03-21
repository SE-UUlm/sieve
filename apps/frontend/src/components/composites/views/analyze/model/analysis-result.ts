import type { SubmitEmailResponseDto } from "@/lib/client/models";

/**
 * Structured analysis payload returned by the backend API.
 */
export type AnalysisResult = SubmitEmailResponseDto["data"];

/**
 * Extracts a category label from the analysis payload.
 *
 * @param result Structured analysis payload from backend.
 * @returns Human-readable category label.
 */
export function getAnalysisCategory(result: AnalysisResult): string {
    if (!result.category) {
        return "Unknown";
    }
    return result.category.replaceAll("_", " ");
}

/**
 * Builds a short summary for the current analysis payload.
 *
 * @param result Structured analysis payload from backend.
 * @returns A concise summary string for display.
 */
export function getAnalysisSummary(result: AnalysisResult): string {
    if ("summary" in result && typeof result.summary === "string") {
        return result.summary;
    }

    if (Array.isArray(result.complaints)) {
        return `Customer reported ${result.complaints.length} complaint(s).`;
    }

    if (Array.isArray(result.products)) {
        return `Customer asked about ${result.products.length} product(s).`;
    }

    if (Array.isArray(result.issues)) {
        return `Customer reported ${result.issues.length} support issue(s).`;
    }

    return "Analysis completed.";
}
