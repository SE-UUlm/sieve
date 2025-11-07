import { ApiProperty } from "@nestjs/swagger";
import { JobStatus } from "../entities/job.entity";
import { randomUUID } from "node:crypto";
import { IsDateString, IsEnum, IsOptional, IsUUID } from "class-validator";

export class JobDto {
    // TODO: replace with actual UUID version once implemented
    @ApiProperty({ description: "Unique job ID", type: String, example: randomUUID() })
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
        example: randomUUID(),
    })
    @IsUUID()
    userId!: string;

    // TODO: replace with actual UUID version once implemented
    @ApiProperty({
        description: "Email ID associated with this job",
        type: String,
        example: randomUUID(),
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
