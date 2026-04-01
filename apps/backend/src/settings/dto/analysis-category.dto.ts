import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
    IsIn,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
} from "class-validator";

export class AnalysisFlowConfigDto {
    @ApiProperty({
        description: "Flow type used to process the category.",
        enum: ["simple", "product"],
        example: "simple",
    })
    @IsString()
    @IsIn(["simple", "product"])
    name!: "simple" | "product";

    @ApiProperty({
        description:
            "JSON schema describing the structured output for this category.",
        type: "object",
        additionalProperties: true,
    })
    @IsObject()
    structured_response_schema!: Record<string, unknown>;

    @ApiPropertyOptional({
        description: "Optional extra prompt for structured output generation.",
        example: "Be concise and list one bullet per complaint.",
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    structured_response_prompt?: string;

    @ApiPropertyOptional({
        description: "Optional prompt for free-text summary generation.",
        example: "Summarize in German using short bullet points.",
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    summary_prompt?: string;

    @ApiPropertyOptional({
        description:
            "Optional prompt used for database lookup step in product flow categories.",
        example:
            "Database hints: products are stored in German and metadata includes part count.",
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    db_step_prompt?: string;

    @ApiPropertyOptional({
        description:
            "Optional prompt used for email response generation in this flow category.",
        example:
            "If the complaint is reasonable, answer that you are sorry and that we will fix it as soon as possible. Otherwise do not answer.",
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    email_response_prompt?: string;
}

export class AnalysisCategoryDto {
    @ApiProperty({
        description: "Category name used in analysis output.",
        example: "Complaint",
    })
    @IsString()
    @MaxLength(32)
    name!: string;

    @ApiProperty({
        description: "Short human-readable description of the category.",
        example:
            "The user expresses dissatisfaction, frustration or complaints and is not product support.",
    })
    @IsString()
    @MaxLength(1000)
    description!: string;

    @ApiProperty({
        description: "Flow configuration for this category.",
        type: AnalysisFlowConfigDto,
    })
    @IsObject()
    flow!: AnalysisFlowConfigDto;
}
