import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ProductDto {
    @ApiProperty({
        description: "Name of the referenced product.",
        example: "Hydraulic Pump HP-200",
    })
    product_name!: string;

    @ApiProperty({
        description: "Requested quantity.",
        example: 3,
    })
    quantity!: number;
}

export class IssueDto {
    @ApiProperty({
        description: "Name of the referenced product.",
        example: "Hydraulic Pump HP-200",
    })
    product_name!: string;

    @ApiProperty({
        description: "Short summary of the issue.",
        example: "The pump leaks after 20 minutes of operation.",
    })
    issue!: string;
}

export class EmailAnalysisResultDto {
    @ApiProperty({
        description: "Detected email category.",
        enum: ["Other", "Complaint", "Product_Inquiry", "Product_Support"],
    })
    category!: "Other" | "Complaint" | "Product_Inquiry" | "Product_Support";

    @ApiPropertyOptional({
        description: "Summary text for generic results.",
        example: "The customer asks for delivery details.",
    })
    summary?: string;

    @ApiPropertyOptional({
        description: "One complaint per item.",
        type: [String],
    })
    complaints?: string[];

    @ApiPropertyOptional({
        description: "Products requested by the customer.",
        type: [ProductDto],
    })
    products?: ProductDto[];

    @ApiPropertyOptional({
        description: "Issues reported by the customer.",
        type: [IssueDto],
    })
    issues?: IssueDto[];
}

export class SubmitEmailResponseDto {
    @ApiProperty({
        description: "Structured analysis payload.",
        type: EmailAnalysisResultDto,
    })
    data!: EmailAnalysisResultDto;
}
