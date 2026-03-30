import {
    type AnalysisResult,
    getAnalysisCategories,
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
    const categories = getAnalysisCategories(result);

    return (
        <ResultSection title="Category" className="space-x-2">
            {categories.map((category) => (
                <Badge
                    key={category}
                    className="border-blue-200 bg-blue-100 px-3 py-1 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
                >
                    {category}
                </Badge>
            ))}
        </ResultSection>
    );
}
