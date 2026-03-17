import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
    IsDateString,
    IsEnum,
    IsObject,
    IsOptional,
    IsString,
    IsUUID,
} from "class-validator";
import { EmailSource } from "../../../prisma/client/enums";
import { EXAMPLE_USER_ID } from "../../common/examples.constants";
import { EmailAnalysisResultDto } from "../../email/dto/email-analysis-result.dto";

export class JobHistoryEntryDto {
    @ApiProperty({
        description: "Unique history entry ID (job ID).",
        type: String,
        example: EXAMPLE_USER_ID,
    })
    @IsUUID()
    id!: string;

    @ApiPropertyOptional({
        description: "Email subject submitted for analysis.",
        type: String,
        nullable: true,
    })
    @IsOptional()
    @IsString()
    subject?: string | null;

    @ApiProperty({
        description: "Email body submitted for analysis.",
        type: String,
    })
    @IsString()
    body!: string;

    @ApiPropertyOptional({
        description: "Structured analysis result for this history item.",
        type: EmailAnalysisResultDto,
        nullable: true,
    })
    @IsOptional()
    @IsObject()
    result?: EmailAnalysisResultDto | null;

    @ApiProperty({
        description: "Creation timestamp",
        type: String,
        format: "date-time",
    })
    @IsDateString()
    createdAt!: string;

    @ApiProperty({
        description: "Source of the email (manual or IMAP)",
        enum: EmailSource,
        example: EmailSource.MANUAL,
    })
    @IsEnum(EmailSource)
    source!: EmailSource;
}
