import {
    Body,
    Controller,
    Get,
    Post,
    Put,
} from "@nestjs/common";
import {
    ApiCookieAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";
import { Roles } from "@thallesp/nestjs-better-auth";
import { UserRole } from "../../prisma/client/enums";
import { ImapService } from "./imap.service";
import { SettingsService } from "../settings/settings.service";
import {
    TestImapConnectionDto,
    ImapStatusDto,
    SaveImapConfigDto,
} from "./dto";

@ApiTags("IMAP")
@Controller("imap")
export class ImapController {
    constructor(
        private readonly imapService: ImapService,
        private readonly settingsService: SettingsService,
    ) {}

    @Post("test")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Test IMAP connection",
        description: "Tests the IMAP connection with the provided credentials without saving them.",
    })
    @ApiResponse({
        status: 200,
        description: "Connection test result",
        type: ImapStatusDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async testConnection(
        @Body() dto: TestImapConnectionDto,
    ): Promise<ImapStatusDto> {
        const result = await this.imapService.testConnection({
            host: dto.host,
            port: dto.port,
            username: dto.username,
            password: dto.password,
            security: dto.security,
            mailbox: dto.mailbox,
        });

        return {
            isConnected: result.isConnected,
            lastError: result.lastError,
            messageCount: result.messageCount,
            isEnabled: false,
        };
    }

    @Get("status")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Get IMAP connection status",
        description: "Returns the current IMAP connection status and configuration.",
    })
    @ApiResponse({
        status: 200,
        description: "Current IMAP status",
        type: ImapStatusDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async getStatus(): Promise<ImapStatusDto> {
        const status = await this.settingsService.getImapStatus();
        return {
            isConnected: status.isConnected,
            isEnabled: status.isEnabled,
            lastError: status.lastError,
            lastSyncedAt: status.lastSyncedAt?.toISOString(),
        };
    }

    @Put("config")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Save IMAP configuration",
        description: "Saves the IMAP configuration and tests the connection.",
    })
    @ApiResponse({
        status: 200,
        description: "Configuration saved successfully",
        type: ImapStatusDto,
    })
    @ApiResponse({ status: 400, description: "Bad Request" })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async saveConfig(@Body() dto: SaveImapConfigDto): Promise<ImapStatusDto> {
        // Test connection first
        const testResult = await this.imapService.testConnection({
            host: dto.host,
            port: dto.port,
            username: dto.username,
            password: dto.password,
            security: dto.security,
            mailbox: dto.mailbox,
        });

        // Save config regardless of test result, but don't enable if test failed
        await this.settingsService.saveImapConfig({
            host: dto.host,
            port: dto.port,
            username: dto.username,
            password: dto.password,
            security: dto.security,
            mailbox: dto.mailbox,
            enabled: dto.enabled && testResult.isConnected,
        });

        const status = await this.settingsService.getImapStatus();
        return {
            isConnected: testResult.isConnected,
            isEnabled: status.isEnabled,
            lastError: testResult.lastError,
            lastSyncedAt: status.lastSyncedAt?.toISOString(),
            messageCount: testResult.messageCount,
        };
    }
}
