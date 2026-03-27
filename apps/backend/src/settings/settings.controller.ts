import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseEnumPipe,
    Patch,
} from "@nestjs/common";
import {
    ApiCookieAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";
import { Roles } from "@thallesp/nestjs-better-auth";
import { AIProvider, UserRole } from "../../prisma/client/enums";
import { InstanceSettingsDto } from "./dto/instance-settings.dto";
import { ProviderModelAvailabilityDto } from "./dto/provider-model-availability.dto";
import { UpdateInstanceActiveProviderDto } from "./dto/update-instance-active-provider.dto";
import { UpdateInstanceApiKeyDto } from "./dto/update-instance-api-key.dto";
import { UpdateInstanceApiKeyEnabledDto } from "./dto/update-instance-api-key-enabled.dto";
import { UpdateInstanceProviderModelsDto } from "./dto/update-instance-provider-models.dto";
import { ValidateInstanceProviderModelDto } from "./dto/validate-instance-provider-model.dto";
import { SettingsService } from "./settings.service";

@ApiTags("Settings")
@Controller("settings")
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}

    @Get("instance")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Get instance-level provider settings (admin only)",
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
            activeProvider:
                await this.settingsService.getResolvedActiveProvider(),
            providers: await this.settingsService.getAdminProviderSettings(),
        };
    }

    @Patch("instance/active-provider")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Set active instance provider (admin only)",
    })
    @ApiResponse({
        status: 200,
        description: "Active provider successfully updated",
        type: InstanceSettingsDto,
    })
    @ApiResponse({ status: 400, description: "Bad Request" })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async updateActiveProvider(
        @Body() dto: UpdateInstanceActiveProviderDto,
    ): Promise<InstanceSettingsDto> {
        const selectableProviders =
            await this.settingsService.getSelectableProviders();

        if (!selectableProviders.includes(dto.provider)) {
            throw new BadRequestException(
                "The selected provider is not currently available.",
            );
        }

        await this.settingsService.setActiveProvider(dto.provider);

        return {
            activeProvider:
                await this.settingsService.getResolvedActiveProvider(),
            providers: await this.settingsService.getAdminProviderSettings(),
        };
    }

    @Patch("instance/providers/:provider/api-key")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Update instance provider API key (admin only)",
    })
    @ApiResponse({
        status: 200,
        description: "API key successfully updated",
        type: InstanceSettingsDto,
    })
    @ApiResponse({ status: 400, description: "Bad Request" })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async updateInstanceApiKey(
        @Param("provider", new ParseEnumPipe(AIProvider)) provider: AIProvider,
        @Body() dto: UpdateInstanceApiKeyDto,
    ): Promise<InstanceSettingsDto> {
        if (!dto.apiKey.trim()) {
            throw new BadRequestException("API key cannot be empty.");
        }

        await this.settingsService.setProviderApiKey(provider, dto.apiKey);

        return {
            activeProvider:
                await this.settingsService.getResolvedActiveProvider(),
            providers: await this.settingsService.getAdminProviderSettings(),
        };
    }

    @Patch("instance/providers/:provider/api-key-enabled")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Enable or disable provider API key usage (admin only)",
    })
    @ApiResponse({
        status: 200,
        description: "API key usage state successfully updated",
        type: InstanceSettingsDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async updateInstanceApiKeyEnabled(
        @Param("provider", new ParseEnumPipe(AIProvider)) provider: AIProvider,
        @Body() dto: UpdateInstanceApiKeyEnabledDto,
    ): Promise<InstanceSettingsDto> {
        await this.settingsService.setProviderEnabled(provider, dto.enabled);

        return {
            activeProvider:
                await this.settingsService.getResolvedActiveProvider(),
            providers: await this.settingsService.getAdminProviderSettings(),
        };
    }

    @Patch("instance/providers/:provider/models")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Update provider simple/complex model settings (admin only)",
    })
    @ApiResponse({
        status: 200,
        description: "Provider model settings successfully updated",
        type: InstanceSettingsDto,
    })
    @ApiResponse({ status: 400, description: "Bad Request" })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async updateInstanceProviderModels(
        @Param("provider", new ParseEnumPipe(AIProvider)) provider: AIProvider,
        @Body() dto: UpdateInstanceProviderModelsDto,
    ): Promise<InstanceSettingsDto> {
        if (!dto.simpleModel.trim() || !dto.complexModel.trim()) {
            throw new BadRequestException("Model identifiers cannot be empty.");
        }

        await this.settingsService.setProviderModels(
            provider,
            dto.simpleModel,
            dto.complexModel,
        );

        return {
            activeProvider:
                await this.settingsService.getResolvedActiveProvider(),
            providers: await this.settingsService.getAdminProviderSettings(),
        };
    }

    @Patch("instance/providers/:provider/model-availability")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Validate provider model availability (admin only)",
    })
    @ApiResponse({
        status: 200,
        description: "Model availability successfully checked",
        type: ProviderModelAvailabilityDto,
    })
    @ApiResponse({ status: 400, description: "Bad Request" })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async validateInstanceProviderModelAvailability(
        @Param("provider", new ParseEnumPipe(AIProvider)) provider: AIProvider,
        @Body() dto: ValidateInstanceProviderModelDto,
    ): Promise<ProviderModelAvailabilityDto> {
        if (!dto.model.trim()) {
            throw new BadRequestException("Model identifier cannot be empty.");
        }

        const isAvailable =
            await this.settingsService.validateProviderModelAvailability(
                provider,
                dto.model,
            );

        return {
            isAvailable,
        };
    }

    @Delete("instance/providers/:provider/api-key")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Delete instance provider API key (admin only)",
    })
    @ApiResponse({
        status: 200,
        description: "API key successfully deleted",
        type: InstanceSettingsDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async deleteInstanceApiKey(
        @Param("provider", new ParseEnumPipe(AIProvider)) provider: AIProvider,
    ): Promise<InstanceSettingsDto> {
        await this.settingsService.clearProviderApiKey(provider);

        return {
            activeProvider:
                await this.settingsService.getResolvedActiveProvider(),
            providers: await this.settingsService.getAdminProviderSettings(),
        };
    }
}
