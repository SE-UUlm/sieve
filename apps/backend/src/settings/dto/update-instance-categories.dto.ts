import { ApiProperty } from "@nestjs/swagger";
import { IsArray } from "class-validator";
import { AnalysisCategoryDto } from "./analysis-category.dto";

export class UpdateInstanceCategoriesDto {
    @ApiProperty({
        description:
            "Category configuration payload used by ai-backend for email categorization.",
        type: [AnalysisCategoryDto],
    })
    @IsArray()
    categories!: AnalysisCategoryDto[];
}
