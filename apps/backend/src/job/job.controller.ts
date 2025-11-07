import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JobDto } from "./dto/job.dto";
import { JobStatus } from "./entities/job.entity";
import { JobResultDto } from "../job-result/dto/job-result.dto";

@ApiTags("Jobs")
@Controller("jobs")
export class JobController {
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: "List jobs (filtered by user unless admin)" })
    @ApiResponse({ status: 200, description: "Jobs successfully retrieved.", type: [JobDto] })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    getJobs(
        @Query("page") page?: number,
        @Query("limit") limit?: number,
        @Query("status") status?: JobStatus,
    ): Promise<JobDto[]> {
        // TODO: Implement job retrieval logic
        return Promise.resolve([]);
    }

    @Get(":jobId")
    @ApiBearerAuth()
    @ApiOperation({ summary: "Get detailed job information" })
    @ApiResponse({ status: 200, description: "Job successfully retrieved.", type: JobDto })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 404, description: "Job not found" })
    getJobById(@Param("jobId") jobId: string): Promise<JobDto> {
        // TODO: Implement job retrieval by ID logic
        return Promise.resolve({} as JobDto);
    }

    @Get(":jobId/result")
    @ApiBearerAuth()
    @ApiOperation({ summary: "Get job result output" })
    @ApiResponse({
        status: 200,
        description: "Job result successfully retrieved.",
        type: JobResultDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 404, description: "Job or result not found" })
    getJobResult(@Param("jobId") jobId: string): Promise<JobResultDto> {
        // TODO: Implement job result retrieval logic
        return Promise.resolve({} as JobResultDto);
    }
}
