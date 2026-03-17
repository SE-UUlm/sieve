import { Injectable, NotFoundException } from "@nestjs/common";
import { type UserSession } from "@thallesp/nestjs-better-auth";
import { type Prisma } from "../../prisma/client/client";
import { JobStatus, UserRole, type EmailSource } from "../../prisma/client/enums";
import type { EmailAnalysisResultDto } from "../email/dto/email-analysis-result.dto";
import type { JobResultDto } from "../job-result/dto/job-result.dto";
import { PrismaService } from "../prisma/prisma.service";
import type { JobDto } from "./dto/job.dto";
import type { JobHistoryEntryDto } from "./dto/job-history-entry.dto";

type PaginationInput = {
    page?: number;
    limit?: number;
};

type JobWithResult = Prisma.JobGetPayload<{
    include: { result: true };
}>;

type JobWithRelations = Prisma.JobGetPayload<{
    include: { email: true; result: true };
}>;

@Injectable()
export class JobService {
    constructor(private readonly prismaService: PrismaService) {}

    /**
     * Returns the list of jobs visible to the active user.
     */
    async getJobs(
        session: UserSession,
        page?: number,
        limit?: number,
        status?: JobStatus,
    ): Promise<JobDto[]> {
        const pagination = this.toPagination({ page, limit });
        const where = this.getScopedJobWhere(session, status);

        const jobs = await this.prismaService.job.findMany({
            where,
            include: { result: true },
            orderBy: { createdAt: "desc" },
            skip: pagination.skip,
            take: pagination.take,
        });

        return jobs.map((job) => this.toJobDto(job));
    }

    /**
     * Returns one job if it is visible to the active user.
     */
    async getJobById(session: UserSession, jobId: string): Promise<JobDto> {
        const job = await this.prismaService.job.findFirst({
            where: this.getScopedJobIdWhere(session, jobId),
            include: { result: true },
        });

        if (!job) {
            throw new NotFoundException("Job not found");
        }

        return this.toJobDto(job);
    }

    /**
     * Returns the result payload for one visible job.
     */
    async getJobResult(
        session: UserSession,
        jobId: string,
    ): Promise<JobResultDto> {
        const job = await this.prismaService.job.findFirst({
            where: this.getScopedJobIdWhere(session, jobId),
            include: { result: true },
        });

        if (!job?.result) {
            throw new NotFoundException("Job or result not found");
        }

        return this.toJobResultDto(job.result);
    }

    /**
     * Returns history entries for the active user.
     * @param source - Optional filter for email source (MANUAL or IMAP)
     */
    async getHistory(
        session: UserSession,
        source?: EmailSource,
    ): Promise<JobHistoryEntryDto[]> {
        const where = this.getScopedJobWhere(session);

        if (source) {
            where.email = {
                source,
            };
        }

        const jobs = await this.prismaService.job.findMany({
            where: {
                ...where,
                status: JobStatus.COMPLETED,
            },
            include: { email: true, result: true },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return jobs.map((job) => this.toJobHistoryEntryDto(job));
    }

    private toPagination({ page, limit }: PaginationInput) {
        const parsedLimit = Number(limit);
        const parsedPage = Number(page);
        const normalizedLimit =
            typeof parsedLimit === "number" && Number.isFinite(parsedLimit)
                ? parsedLimit
                : 25;
        const normalizedPage =
            typeof parsedPage === "number" && Number.isFinite(parsedPage)
                ? parsedPage
                : 1;

        const take = Math.min(Math.max(Math.trunc(normalizedLimit), 1), 100);
        const safePage = Math.max(Math.trunc(normalizedPage), 1);
        const skip = (safePage - 1) * take;

        return { skip, take };
    }

    private isAdmin(session: UserSession): boolean {
        const role = session.user.role;
        if (Array.isArray(role)) {
            return role.includes(UserRole.ADMIN);
        }
        return role === UserRole.ADMIN;
    }

    private getScopedJobWhere(
        session: UserSession,
        status?: JobStatus,
    ): Prisma.JobWhereInput {
        const where: Prisma.JobWhereInput = {};
        if (status) {
            where.status = status;
        }
        if (!this.isAdmin(session)) {
            where.userId = session.user.id;
        }
        return where;
    }

    private getScopedJobIdWhere(
        session: UserSession,
        jobId: string,
    ): Prisma.JobWhereInput {
        if (this.isAdmin(session)) {
            return { id: jobId };
        }

        return {
            id: jobId,
            userId: session.user.id,
        };
    }

    private toJobDto(job: JobWithResult): JobDto {
        return {
            id: job.id,
            status: job.status,
            userId: job.userId,
            emailId: job.emailId,
            startedAt: job.startedAt?.toISOString() ?? null,
            completedAt: job.completedAt?.toISOString() ?? null,
            createdAt: job.createdAt.toISOString(),
            resultId: job.result?.id ?? null,
        };
    }

    private toJobResultDto(
        result: Prisma.JobResultGetPayload<Record<string, never>>,
    ): JobResultDto {
        return {
            id: result.id,
            jobId: result.jobId,
            status: result.status,
            output: result.output,
            createdAt: result.createdAt.toISOString(),
        };
    }

    private toJobHistoryEntryDto(job: JobWithRelations): JobHistoryEntryDto {
        return {
            id: job.id,
            subject: job.email.subject,
            body: job.email.body,
            result: this.toHistoryResult(job.result?.output),
            createdAt: job.createdAt.toISOString(),
            source: job.email.source,
        };
    }

    private toHistoryResult(
        output: Prisma.JsonValue | null | undefined,
    ): EmailAnalysisResultDto | null {
        if (!output || typeof output !== "object" || Array.isArray(output)) {
            return null;
        }

        const candidate = output as Record<string, unknown>;
        if (!Array.isArray(candidate.category_results)) {
            return null;
        }

        return output as unknown as EmailAnalysisResultDto;
    }
}
