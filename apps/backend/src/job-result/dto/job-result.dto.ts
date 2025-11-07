import { ApiProperty } from "@nestjs/swagger";
import { JobResultStatus } from "../entities/job-result.entity";
import { IsDateString, IsEnum, IsObject, IsOptional, IsUUID } from "class-validator";
import { EXAMPLE_USER_ID } from "../../common/examples.constants";

export class JobResultDto {
    // TODO: replace with actual UUID version once implemented
    @ApiProperty({ description: "Unique JobResult ID", type: String, example: EXAMPLE_USER_ID })
    @IsUUID()
    id!: string;

    // TODO: replace with actual UUID version once implemented
    @ApiProperty({ description: "Associated Job ID", type: String, example: EXAMPLE_USER_ID })
    @IsUUID()
    jobId!: string;

    @ApiProperty({
        description: "Status of the job result",
        enum: JobResultStatus,
        example: JobResultStatus.SUCCESS,
    })
    @IsEnum(JobResultStatus)
    status!: JobResultStatus;

    @ApiProperty({ description: "JSON output of the job", type: Object })
    @IsObject()
    output!: any;

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
}
