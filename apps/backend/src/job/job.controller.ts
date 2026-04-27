import {
    Body,
    Controller,
    Get,
    Param,
    ParseEnumPipe,
    Patch,
    Query,
} from "@nestjs/common";
import {
    ApiCookieAuth,
    ApiOperation,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { EmailSource, JobStatus } from "../../prisma/client/enums"; // Separate import for clarity
import { JobResultDto } from "../job-result/dto/job-result.dto";
import { JobDto } from "./dto/job.dto";
import { JobHistoryEntryDto } from "./dto/job-history-entry.dto";
import { UpdateJobHandledDto } from "./dto/update-job-handled.dto";
import { JobService } from "./job.service";

@ApiTags("Jobs")
@Controller("jobs")
export class JobController {
    constructor(private readonly jobService: JobService) {}

    @Get("history")
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "List completed job history with analysis output",
    })
    @ApiResponse({
        status: 200,
        description: "History successfully retrieved.",
        type: [JobHistoryEntryDto],
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiQuery({ name: "source", enum: ["MANUAL", "IMAP"], required: false })
    getHistory(
        @Session() session: UserSession,
        @Query("source") source?: EmailSource,
    ): Promise<JobHistoryEntryDto[]> {
        return this.jobService.getHistory(session, source);
    }

    @Get()
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({ summary: "List jobs (filtered by user unless admin)" })
    @ApiResponse({
        status: 200,
        description: "Jobs successfully retrieved.",
        type: [JobDto],
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    getJobs(
        @Session() session: UserSession,
        @Query("page") page?: number,
        @Query("limit") limit?: number,
        @Query("status", new ParseEnumPipe(JobStatus, { optional: true }))
        status?: JobStatus,
    ): Promise<JobDto[]> {
        return this.jobService.getJobs(session, page, limit, status);
    }

    @Get(":jobId")
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({ summary: "Get detailed job information" })
    @ApiResponse({
        status: 200,
        description: "Job successfully retrieved.",
        type: JobDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 404, description: "Job not found" })
    getJobById(
        @Session() session: UserSession,
        @Param("jobId") jobId: string,
    ): Promise<JobDto> {
        return this.jobService.getJobById(session, jobId);
    }

    @Patch(":jobId/handled")
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({ summary: "Set handled status for a job" })
    @ApiResponse({
        status: 200,
        description: "Handled status updated.",
        type: JobHistoryEntryDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 404, description: "Job not found" })
    setJobHandled(
        @Session() session: UserSession,
        @Param("jobId") jobId: string,
        @Body() dto: UpdateJobHandledDto,
    ): Promise<JobHistoryEntryDto> {
        return this.jobService.setHandled(session, jobId, dto.handled);
    }

    @Get(":jobId/result")
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({ summary: "Get job result output" })
    @ApiResponse({
        status: 200,
        description: "Job result successfully retrieved.",
        type: JobResultDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 404, description: "Job or result not found" })
    getJobResult(
        @Session() session: UserSession,
        @Param("jobId") jobId: string,
    ): Promise<JobResultDto> {
        return this.jobService.getJobResult(session, jobId);
    }
}
