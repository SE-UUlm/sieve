import {
    Body,
    Controller,
    HttpException,
    HttpStatus,
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

@ApiTags("Emails")
@Controller("emails")
export class EmailController {
    constructor(private readonly aiBackendService: AiBackendService) {}

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
            return { data: result };
        } catch (error) {
            Logger.error("Error running AiBackend agent:", error);

            throw new HttpException(
                {
                    message: "Failed to process email",
                    details: error instanceof Error ? error.message : error,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
