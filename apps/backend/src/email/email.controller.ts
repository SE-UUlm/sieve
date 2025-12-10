import { Body, Controller, HttpException, HttpStatus, Logger, Post } from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateEmailDto } from "./dto/create-email.dto";
import { LangflowService } from "../langflow/langflow.service";

@ApiTags("Emails")
@Controller("emails")
export class EmailController {
    constructor(private readonly langflowService: LangflowService) {}

    @Post()
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({ summary: "Submit an email for processing" })
    // TODO: Temporarily return response directly until jobs and emails are properly implemented
    @ApiResponse({
        status: 201,
        description: "Successfully submitted",
        schema: {
            type: "object",
            properties: {
                data: {
                    type: "string",
                },
            },
            required: ["data"],
        },
    })
    @ApiResponse({ status: 400, description: "Bad Request" })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({
        status: 500,
        description: "Langflow processing failed",
        schema: {
            type: "object",
            properties: {
                message: { type: "string" },
                details: { type: "string" },
            },
        },
    })
    async submitEmail(@Body() dto: CreateEmailDto): Promise<{ data: string }> {
        try {
            const response = await this.langflowService.runFlow(dto.body);
            return { data: response.message };
        } catch (error) {
            Logger.error("Error running Langflow flow:", error);

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
