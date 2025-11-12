import { Body, Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateEmailDto } from "./dto/create-email.dto";
import { JobDto } from "../job/dto/job.dto";

// TODO: Remove eslint-disable when implementing methods
/* eslint-disable @typescript-eslint/no-unused-vars */
@ApiTags("Emails")
@Controller("emails")
export class EmailController {
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: "Submit an email for processing" })
    @ApiResponse({ status: 201, description: "Successfully submitted", type: JobDto })
    @ApiResponse({ status: 400, description: "Bad Request" })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    submitEmail(@Body() emailData: CreateEmailDto): Promise<JobDto> {
        // TODO: Implement email upload logic
        return Promise.resolve({} as JobDto);
    }
}
