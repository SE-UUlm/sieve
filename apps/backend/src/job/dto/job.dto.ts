import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsUUID } from "class-validator";
import { EXAMPLE_USER_ID } from "../../common/examples.constants";
import { JobStatus } from "../../../prisma/client/enums";

export class JobDto {
    // TODO: replace with actual UUID version once implemented
    @ApiProperty({ description: "Unique job ID", type: String, example: EXAMPLE_USER_ID })
    @IsUUID()
    id!: string;

    @ApiProperty({
        description: "Current status of the job",
        enum: JobStatus,
        example: JobStatus.CREATED,
    })
    @IsEnum(JobStatus)
    status!: JobStatus;

    // TODO: replace with actual UUID version once implemented
    @ApiProperty({
        description: "User ID who created the job",
        type: String,
        example: EXAMPLE_USER_ID,
    })
    @IsUUID()
    userId!: string;

    // TODO: replace with actual UUID version once implemented
    @ApiProperty({
        description: "Email ID associated with this job",
        type: String,
        example: EXAMPLE_USER_ID,
    })
    @IsUUID()
    emailId!: string;

    @ApiProperty({
        description: "Job start timestamp",
        type: String,
        format: "date-time",
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsDateString()
    startedAt?: string | null;

    @ApiProperty({
        description: "Job completion timestamp",
        type: String,
        format: "date-time",
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsDateString()
    completedAt?: string | null;

    @ApiProperty({ description: "Creation timestamp", type: String, format: "date-time" })
    @IsDateString()
    createdAt!: string;

    @ApiProperty({
        description: "Deletion timestamp if soft-deleted",
        type: String,
        format: "date-time",
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsDateString()
    deletedAt?: string | null;

    @ApiProperty({
        description: "Associated JobResult ID, if completed",
        type: String,
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsUUID()
    resultId?: string | null;
}
