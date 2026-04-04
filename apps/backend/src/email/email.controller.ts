import {
    Body,
    Controller,
    HttpCode,
    HttpException,
    InternalServerErrorException,
    Logger,
    Post,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
    ApiCookieAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";
import { SmtpService } from "src/smtp/smtp.service";
import { AiBackendService } from "../ai-backend/ai-backend.service";
import { CreateEmailDto } from "./dto/create-email.dto";
import { SubmitEmailResponseDto } from "./dto/email-analysis-result.dto";
import { SendEmailResponseDto } from "./dto/send-email-response.dto";

@ApiTags("Emails")
@Controller("emails")
export class EmailController {
    private autoSendResponseThreshold!: number;

    constructor(
        private readonly aiBackendService: AiBackendService,
        private smtpService: SmtpService,
        private configService: ConfigService<null, true>,
    ) {}

    onModuleInit() {
        this.autoSendResponseThreshold = this.configService.get<number>(
            "AUTO_SEND_RESPOND_THRESHOLD",
        );
    }

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
                this.autoSendResponseThreshold !== -1 &&
                result.confidence_assessment.score >
                    this.autoSendResponseThreshold &&
                this.smtpService.isConfigured()
            ) {
                try {
                    this.smtpService.sendMail(
                        // Do not wait for email sending to speed up display of result
                        dto.sender,
                        dto.subject
                            ? `Re: ${dto.subject}`
                            : emailResponse.response_subject ||
                                  "Support Response",
                        emailResponse.response_body,
                    );
                    emailResponseSent = true;
                } catch (error) {
                    Logger.error("Error sending email response:", error);
                }
            }

            return {
                data: result,
                email_reseponse_sent: emailResponseSent,
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

    @Post("send-email-response")
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({ summary: "Send a email response to a customer" })
    @HttpCode(200)
    // TODO: Temporarily use a plain send until job and email persistency is properly implemented
    @ApiResponse({
        status: 200,
        description: "Successfully submitted",
    })
    @ApiResponse({ status: 400, description: "Bad Request" })
    @ApiResponse({
        status: 503,
        description: "Email send is not configured for this instance",
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({
        status: 500,
        description: "Email send has failed",
    })
    /**
     * Submits an email payload for analysis and returns structured output.
     */
    async sendEmailResponse(
        @Body() dto: SendEmailResponseDto,
    ): Promise<boolean> {
        try {
            await this.smtpService.sendMail(
                dto.receiptient,
                dto.subject,
                dto.body,
            );

            return true;
        } catch (error) {
            Logger.error("Error sending email via smtp:", error);

            throw new InternalServerErrorException({
                message: "Failed to send email",
                details: error instanceof Error ? error.message : error,
            });
        }
    }
}
