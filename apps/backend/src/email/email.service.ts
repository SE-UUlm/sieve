import {
    HttpException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from "@nestjs/common";
import type { Prisma } from "../../prisma/client/client";
import { JobResultStatus, JobStatus } from "../../prisma/client/enums";
import { AiBackendService } from "../ai-backend/ai-backend.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEmailDto } from "./dto/create-email.dto";
import { SubmitEmailResponseDto } from "./dto/email-analysis-result.dto";

@Injectable()
export class EmailService {
    constructor(
        private readonly aiBackendService: AiBackendService,
        private readonly prismaService: PrismaService,
    ) {}

    /**
     * Submits an email for analysis and persists the completed history entry.
     */
    async submitEmail(
        userId: string,
        dto: CreateEmailDto,
    ): Promise<SubmitEmailResponseDto> {
        try {
            const analysisResult = await this.aiBackendService.runFlow(
                dto.body,
                dto.subject,
            );
            const now = new Date();

            await this.prismaService.$transaction(async (transaction) => {
                const email = await transaction.email.create({
                    data: {
                        userId,
                        subject: dto.subject?.trim() || null,
                        body: dto.body,
                    },
                });

                const job = await transaction.job.create({
                    data: {
                        userId,
                        emailId: email.id,
                        status: JobStatus.COMPLETED,
                        startedAt: now,
                        completedAt: now,
                    },
                });

                await transaction.jobResult.create({
                    data: {
                        jobId: job.id,
                        status: JobResultStatus.SUCCESS,
                        output: analysisResult as unknown as Prisma.InputJsonValue,
                    },
                });
            });

            return { data: analysisResult, email_response_sent: false };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            Logger.error("Error submitting email:", error);
            throw new InternalServerErrorException({
                message: "Failed to process email",
                details: error instanceof Error ? error.message : error,
            });
        }
    }
}
