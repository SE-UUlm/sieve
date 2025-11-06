import { ApiProperty } from "@nestjs/swagger";
import { JobStatus } from "../entities/job.entity";
import { randomUUID } from "node:crypto";

export class JobDto {
    // TODO: replace with actual UUID version once implemented
    @ApiProperty({ description: "Unique job ID", type: String, example: randomUUID() })
    id!: string;

    @ApiProperty({
        description: "Current status of the job",
        enum: JobStatus,
        example: JobStatus.CREATED,
    })
    status!: JobStatus;

    // TODO: replace with actual UUID version once implemented
    @ApiProperty({
        description: "User ID who created the job",
        type: String,
        example: randomUUID(),
    })
    userId!: string;

    // TODO: replace with actual UUID version once implemented
    @ApiProperty({
        description: "Email ID associated with this job",
        type: String,
        example: randomUUID(),
    })
    emailId!: string;

    @ApiProperty({
        description: "Job start timestamp",
        type: String,
        format: "date-time",
        required: false,
        nullable: true,
    })
    startedAt?: string | null;

    @ApiProperty({
        description: "Job completion timestamp",
        type: String,
        format: "date-time",
        required: false,
        nullable: true,
    })
    completedAt?: string | null;

    @ApiProperty({ description: "Creation timestamp", type: String, format: "date-time" })
    createdAt!: string;

    @ApiProperty({
        description: "Deletion timestamp if soft-deleted",
        type: String,
        format: "date-time",
        required: false,
        nullable: true,
    })
    deletedAt?: string | null;

    @ApiProperty({
        description: "Associated JobResult ID, if completed",
        type: String,
        required: false,
        nullable: true,
    })
    resultId?: string | null;
}
