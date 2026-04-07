import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class FlowSteps {
    @ApiProperty({
        description: "Summary text for this category",
        example: "The customer is inquiring about ordering 23 beach villas.",
    })
    summary!: string;

    @ApiPropertyOptional({
        description: "Email response part for this category.",
        example:
            "Thank you for your inquiry about the 23 beach villas! I recommend the “Creator Beach Villa 3-in-1” set, which includes 1,021 pieces and is available for €94.99.",
    })
    email_response?: { response_body_part: string };
}

export class CategoryResultDto {
    @ApiProperty({
        description: "The name of the category.",
        example: "Product Inquiry",
    })
    category!: string;

    @ApiProperty({
        description:
            "Structured output in the format specified by the json schema of the category.",
    })
    structured_output!: unknown;

    @ApiProperty({
        description: "Steps the flow has executed for this category.",
    })
    steps!: FlowSteps;
}

export class EmailResponseDto {
    @ApiProperty({
        description: "Email body of the response to the customer",
    })
    response_body!: string;

    @ApiProperty({
        description: "Email subject of the response to the customer",
    })
    response_subject!: string;
}

export class ConfidenceAssessmentDto {
    @ApiPropertyOptional({
        description:
            "Conservative confidence score (0-100) for how accurately the overall drafted response matches the original customer email.",
        minimum: 0,
        maximum: 100,
    })
    score!: number | null;

    @ApiProperty({
        description:
            "One short English sentence explaining the confidence score, or why confidence is not applicable.",
    })
    rationale!: string;
}

export class EmailAnalysisResultDto {
    @ApiPropertyOptional({
        description: "Overall email response to the customer",
    })
    email_response?: EmailResponseDto;

    @ApiProperty({
        description: "Results for each matching category.",
        type: [CategoryResultDto],
    })
    category_results!: CategoryResultDto[];

    @ApiProperty({
        description:
            "Confidence assessment for the overall drafted customer response.",
        type: ConfidenceAssessmentDto,
    })
    confidence_assessment!: ConfidenceAssessmentDto;
}

export class SubmitEmailResponseDto {
    @ApiProperty({
        description: "Structured analysis payload.",
        type: EmailAnalysisResultDto,
    })
    data!: EmailAnalysisResultDto;

    @ApiProperty({
        description:
            "Whether a email response to the customer was already sent because it met the confidence threshold.",
        type: "boolean",
    })
    email_response_sent: boolean = false;

    @ApiProperty({
        description: "The ID of the job created for this analysis.",
        type: String,
    })
    @IsUUID()
    jobId!: string;
}
