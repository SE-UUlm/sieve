import { Body, Controller, Post } from "@nestjs/common";
import {
    ApiCookieAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { CreateEmailDto } from "./dto/create-email.dto";
import { SubmitEmailResponseDto } from "./dto/email-analysis-result.dto";
import { EmailService } from "./email.service";

@ApiTags("Emails")
@Controller("emails")
export class EmailController {
    constructor(private readonly emailService: EmailService) {}

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
        @Session() session: UserSession,
        @Body() dto: CreateEmailDto,
    ): Promise<SubmitEmailResponseDto> {
        return this.emailService.submitEmail(session.user.id, dto);
    }
}
