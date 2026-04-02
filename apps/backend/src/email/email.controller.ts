import {
    Body,
    Controller,
    HttpException,
    InternalServerErrorException,
    Logger,
    Post,
} from "@nestjs/common";
import {
    ApiCookieAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";
import { AiBackendService } from "../ai-backend/ai-backend.service";
import { CreateEmailDto } from "./dto/create-email.dto";
import { SubmitEmailResponseDto } from "./dto/email-analysis-result.dto";
import { SmtpService } from "src/smtp/smtp.service";

@ApiTags("Emails")
@Controller("emails")
export class EmailController {
    constructor(
        private readonly aiBackendService: AiBackendService,
        private smtpService: SmtpService,
    ) {}

    @Post()
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({ summary: "Submit an email for processing" })
    // TODO: Temporarily return response directly until jobs and emails are properly implemented
    @ApiResponse({
        status: 201,
        description: "Successfully submitted",
        type: SubmitEmailResponseDto,
    })
    @ApiResponse({ status: 400, description: "Bad Request" })
    @ApiResponse({
        status: 423,
        description: "Active provider API key usage is disabled by admin",
    })
    @ApiResponse({
        status: 503,
        description: "Active provider key is not configured",
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({
        status: 500,
        description: "AiBackend processing failed",
        schema: {
            type: "object",
            properties: {
                message: { type: "string" },
                details: { type: "string" },
            },
        },
    })
    /**
     * Submits an email payload for analysis and returns structured output.
     */
    async submitEmail(
        @Body() dto: CreateEmailDto,
    ): Promise<SubmitEmailResponseDto> {
        try {
            const result = await this.aiBackendService.runFlow(
                dto.body,
                dto.subject,
            );

            let emailResponseSent = false;

            const emailResponse = result.email_response;
            if (
                emailResponse &&
                dto.sender &&
                result.confidence_assessment.score != null &&
                result.confidence_assessment.score > 0.8
            ) {
                await this.smtpService.sendMail(
                    dto.sender,
                    dto.subject
                        ? `Re: ${dto.subject}`
                        : emailResponse.response_subject || "Support Response",
                    emailResponse.response_body,
                );
                emailResponseSent = true;
            }

            return {
                data: result,
                email_reseponse_sent: emailResponseSent,
                sender: dto.sender ?? undefined,
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            Logger.error("Error running AiBackend agent:", error);

            throw new InternalServerErrorException({
                message: "Failed to process email",
                details: error instanceof Error ? error.message : error,
            });
        }
    }
}
