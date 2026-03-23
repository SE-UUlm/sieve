import { Body, Controller, Get, Post, Put } from "@nestjs/common";
import {
    ApiCookieAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";
import { Roles } from "@thallesp/nestjs-better-auth";
import { UserRole } from "../../prisma/client/enums";
import { AuthUser } from "../lib/auth-user.decorator";
import { SettingsService } from "../settings/settings.service";
import {
    ImapConfigDto,
    ImapStatusDto,
    MailboxCountDto,
    ProcessEmailsResponseDto,
    SaveImapConfigDto,
    TestImapConnectionDto,
} from "./dto";
import { ImapService } from "./imap.service";
import { ImapPollerService } from "./imap-poller.service";

@ApiTags("IMAP")
@Controller("imap")
export class ImapController {
    constructor(
        private readonly imapService: ImapService,
        private readonly settingsService: SettingsService,
        private readonly imapPollerService: ImapPollerService,
    ) {}

    @Post("test")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Test IMAP connection",
        description:
            "Tests the IMAP connection with the provided credentials. Does not process any emails - use 'process-existing' endpoint for that.",
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

        // Update the stored connection status based on test result
        await this.settingsService.setImapConnectionStatus(result.isConnected);

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
        description: "Returns the current IMAP connection status.",
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

    @Get("config")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Get IMAP configuration",
        description: "Returns the saved IMAP configuration.",
    })
    @ApiResponse({
        status: 200,
        description: "IMAP configuration",
        type: ImapConfigDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async getConfig(): Promise<ImapConfigDto | null> {
        const config = await this.settingsService.getImapConfig();
        if (!config) {
            return null;
        }
        return {
            host: config.host,
            port: config.port,
            username: config.username,
            security: config.security,
            mailbox: config.mailbox,
            enabled: false, // Will be determined by getImapStatus
        };
    }

    @Put("config")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Save IMAP configuration",
        description: "Saves the IMAP configuration, tests the connection, and processes existing emails (excluding ai_analyzed folder).",
    })
    @ApiResponse({
        status: 200,
        description: "Configuration saved successfully",
        type: ImapStatusDto,
    })
    @ApiResponse({ status: 400, description: "Bad Request" })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async saveConfig(
        @Body() dto: SaveImapConfigDto,
        @AuthUser() user: { id: string },
    ): Promise<ImapStatusDto> {
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
        await this.settingsService.saveImapConfig(
            {
                host: dto.host,
                port: dto.port,
                username: dto.username,
                password: dto.password,
                security: dto.security,
                mailbox: dto.mailbox,
                enabled: dto.enabled && testResult.isConnected,
            },
            testResult.isConnected,
        );

        // If connection successful, process emails in background
        if (testResult.isConnected) {
            this.processEmailsInBackground(dto, user.id);
        }

        const status = await this.settingsService.getImapStatus();
        return {
            isConnected: testResult.isConnected,
            isEnabled: status.isEnabled,
            lastError: testResult.lastError,
            lastSyncedAt: status.lastSyncedAt?.toISOString(),
            messageCount: testResult.messageCount,
        };
    }

    /**
     * Processes emails in the background after successful connection test.
     * Does not block the response - runs asynchronously.
     */
    private processEmailsInBackground(dto: SaveImapConfigDto, userId: string): void {
        this.imapPollerService.processExistingEmails(
            {
                host: dto.host,
                port: dto.port,
                username: dto.username,
                password: dto.password,
                security: dto.security,
                mailbox: dto.mailbox,
            },
            userId,
        ).catch((error) => {
            // Log error but don't fail the request - this is fire-and-forget
            console.error("[IMAP] Background email processing failed:", error);
        });
    }

    @Post("mailbox-count")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Get mailbox message count",
        description:
            "Returns the total number of messages in the IMAP mailbox without marking them as read.",
    })
    @ApiResponse({
        status: 200,
        description: "Mailbox count retrieved",
        type: MailboxCountDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async getMailboxCount(
        @Body() dto: TestImapConnectionDto,
    ): Promise<MailboxCountDto> {
        const count = await this.imapPollerService.getMailboxMessageCount({
            host: dto.host,
            port: dto.port,
            username: dto.username,
            password: dto.password,
            security: dto.security,
            mailbox: dto.mailbox,
        });

        return { count };
    }

    @Post("process-existing")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Process existing emails",
        description:
            "Processes all existing emails in the mailbox and creates history entries.",
    })
    @ApiResponse({
        status: 200,
        description: "Emails processed successfully",
        type: ProcessEmailsResponseDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async processExistingEmails(
        @Body() dto: SaveImapConfigDto,
        @AuthUser() user: { id: string },
    ): Promise<ProcessEmailsResponseDto> {
        const processedCount =
            await this.imapPollerService.processExistingEmails(
                {
                    host: dto.host,
                    port: dto.port,
                    username: dto.username,
                    password: dto.password,
                    security: dto.security,
                    mailbox: dto.mailbox,
                },
                user.id,
            );

        return {
            processedCount,
            success: true,
        };
    }
}
