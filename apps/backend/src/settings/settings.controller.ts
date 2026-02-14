import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Patch,
} from "@nestjs/common";
import {
    ApiCookieAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";
import { Roles } from "@thallesp/nestjs-better-auth";
import { UserRole } from "../../prisma/client/enums";
import { InstanceSettingsDto } from "./dto/instance-settings.dto";
import { UpdateInstanceApiKeyDto } from "./dto/update-instance-api-key.dto";
import { UpdateInstanceApiKeyEnabledDto } from "./dto/update-instance-api-key-enabled.dto";
import { SettingsService } from "./settings.service";

@ApiTags("Settings")
@Controller("settings")
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @Get("instance")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Get instance-level settings (admin only)",
    })
    @ApiResponse({
        status: 200,
        description: "Instance settings successfully retrieved",
        type: InstanceSettingsDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async getInstanceSettings(): Promise<InstanceSettingsDto> {
        return {
            hasOpenAIApiKey: await this.settingsService.hasOpenAIApiKey(),
            isOpenAIApiKeyEnabled:
                await this.settingsService.isOpenAIApiKeyEnabled(),
        };
    }

    @Patch("instance/api-key")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Update instance-level OpenAI API key (admin only)",
    })
    @ApiResponse({
        status: 200,
        description: "API key successfully updated",
        type: InstanceSettingsDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async updateInstanceApiKey(
        @Body() dto: UpdateInstanceApiKeyDto,
    ): Promise<InstanceSettingsDto> {
        if (!dto.apiKey.trim()) {
            throw new BadRequestException("API key cannot be empty.");
        }

        await this.settingsService.setOpenAIApiKey(dto.apiKey);
        return {
            hasOpenAIApiKey: true,
            isOpenAIApiKeyEnabled:
                await this.settingsService.isOpenAIApiKeyEnabled(),
        };
    }

    @Patch("instance/api-key-enabled")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Enable or disable instance-level OpenAI API key usage",
    })
    @ApiResponse({
        status: 200,
        description: "API key usage state successfully updated",
        type: InstanceSettingsDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async updateInstanceApiKeyEnabled(
        @Body() dto: UpdateInstanceApiKeyEnabledDto,
    ): Promise<InstanceSettingsDto> {
        await this.settingsService.setOpenAIApiKeyEnabled(dto.enabled);
        return {
            hasOpenAIApiKey: await this.settingsService.hasOpenAIApiKey(),
            isOpenAIApiKeyEnabled:
                await this.settingsService.isOpenAIApiKeyEnabled(),
        };
    }

    @Delete("instance/api-key")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Delete instance-level OpenAI API key (admin only)",
    })
    @ApiResponse({
        status: 200,
        description: "API key successfully deleted",
        type: InstanceSettingsDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async deleteInstanceApiKey(): Promise<InstanceSettingsDto> {
        await this.settingsService.clearOpenAIApiKey();
        return {
            hasOpenAIApiKey: false,
            isOpenAIApiKeyEnabled: false,
        };
    }
}
