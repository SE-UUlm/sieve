import { ApiProperty } from "@nestjs/swagger";
import { JobResultStatus } from "../entities/job-result.entity";
import { randomUUID } from "node:crypto";

export class JobResultDto {
    // TODO: replace with actual UUID version once implemented
    @ApiProperty({ description: "Unique JobResult ID", type: String, example: randomUUID() })
    id!: string;

    // TODO: replace with actual UUID version once implemented
    @ApiProperty({ description: "Associated Job ID", type: String, example: randomUUID() })
    jobId!: string;

    @ApiProperty({
        description: "Status of the job result",
        enum: JobResultStatus,
        example: JobResultStatus.SUCCESS,
    })
    status!: JobResultStatus;

    @ApiProperty({ description: "JSON output of the job", type: Object })
    output!: any;

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
}
