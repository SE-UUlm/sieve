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
    description: "AiBackend processing failed",
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
      const response = await this.aiBackendService.runFlow(dto.body);
      return { data: response.message };
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
