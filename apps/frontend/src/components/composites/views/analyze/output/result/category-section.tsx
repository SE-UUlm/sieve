import {
    type AnalysisResult,
    getAnalysisCategory,
} from "@/components/composites/views/analyze/model/analysis-result";
import { Badge } from "@/components/primitives/badge";
import { ResultSection } from "./result-section";

type CategorySectionProps = {
    result: AnalysisResult;
};

/**
 * Displays the extracted analysis category.
 */
export function CategorySection({ result }: CategorySectionProps) {
    return (
        <ResultSection title="Category">
            <Badge className="border-blue-200 bg-blue-100 px-3 py-1 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                {getAnalysisCategory(result)}
            </Badge>
        </ResultSection>
    );
}
