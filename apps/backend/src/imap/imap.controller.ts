import {
    Body,
    Controller,
    Get,
    HttpCode,
    Logger,
    Param,
    ParseIntPipe,
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
import { AuthUser } from "../lib/auth-user.decorator";
import { SettingsService } from "../settings/settings.service";
import {
    AnalyzeSelectedEmailsDto,
    AnalyzeSelectedResponseDto,
    ImapConfigDto,
    ImapFolderListDto,
    ImapStatusDto,
    InboxEmailBodyDto,
    InboxEmailListDto,
    ListFoldersRequestDto,
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
    private readonly logger = new Logger(ImapController.name);

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
            lastUid: 0,
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
            autoProcessEnabled: config.autoProcessEnabled,
        };
    }

    @Put("config")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Save IMAP configuration",
        description:
            "Saves the IMAP configuration, tests the connection, and processes existing emails (excluding ai_analyzed folder).",
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
        @AuthUser() _user: { id: string },
    ): Promise<ImapStatusDto> {
        this.logger.log(
            `[saveConfig] Called – host=${dto.host} port=${dto.port} password=${dto.password ? "(set)" : "(empty)"}`,
        );

        const testResult = await this.imapService.testConnection({
            host: dto.host,
            port: dto.port,
            username: dto.username,
            password: dto.password,
            security: dto.security,
            mailbox: dto.mailbox,
            lastUid: 0,
        });
        this.logger.log(
            `[saveConfig] testConnection result: isConnected=${testResult.isConnected} error=${testResult.lastError ?? "none"}`,
        );

        // When enabling auto-process, snapshot the current max UID so that
        // existing emails in the inbox are not picked up by the cron job.
        let initialLastUid: number | undefined;
        if (dto.autoProcessEnabled && testResult.isConnected) {
            try {
                initialLastUid = await this.imapPollerService.getMailboxMaxUid({
                    host: dto.host,
                    port: dto.port,
                    username: dto.username,
                    password: dto.password,
                    security: dto.security,
                    mailbox: dto.mailbox,
                    lastUid: 0,
                });
                this.logger.log(
                    `[saveConfig] Snapshotted max UID for auto-process: ${initialLastUid}`,
                );
            } catch {
                initialLastUid = 0;
            }
        }

        await this.settingsService.saveImapConfig(
            {
                host: dto.host,
                port: dto.port,
                username: dto.username,
                password: dto.password,
                security: dto.security,
                mailbox: dto.mailbox,
                enabled: dto.enabled && testResult.isConnected,
                autoProcessEnabled: dto.autoProcessEnabled,
                initialLastUid,
            },
            testResult.isConnected,
        );

        const status = await this.settingsService.getImapStatus();
        return {
            isConnected: testResult.isConnected,
            isEnabled: status.isEnabled,
            lastError: testResult.lastError,
            lastSyncedAt: status.lastSyncedAt?.toISOString(),
            messageCount: testResult.messageCount,
        };
    }

    @Post("list-folders")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "List available IMAP folders",
        description:
            "Connects with the provided credentials and returns all available IMAP folders. Used for folder selection before saving settings.",
    })
    @ApiResponse({
        status: 200,
        description: "List of available folders",
        type: ImapFolderListDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async listFolders(
        @Body() dto: ListFoldersRequestDto,
    ): Promise<ImapFolderListDto> {
        const folders = await this.imapPollerService.listFolders(dto);
        return { folders };
    }

    @Get("inbox-emails")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Get emails in configured inbox",
        description:
            "Returns metadata for all emails currently in the configured inbox folder (not yet moved to ai_analyzed).",
    })
    @ApiResponse({
        status: 200,
        description: "List of inbox emails",
        type: InboxEmailListDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async getInboxEmails(): Promise<InboxEmailListDto> {
        const emails = await this.imapPollerService.getInboxEmails();
        return { emails };
    }

    @Get("inbox-emails/:uid/body")
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Get email body by UID",
        description:
            "Fetches the plain-text body of a single inbox email by its IMAP UID.",
    })
    @ApiResponse({
        status: 200,
        description: "Email body",
        type: InboxEmailBodyDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async getEmailBody(
        @Param("uid", ParseIntPipe) uid: number,
    ): Promise<InboxEmailBodyDto> {
        return this.imapPollerService.getEmailBody(uid);
    }

    @Post("analyze-selected")
    @HttpCode(200)
    @Roles([UserRole.ADMIN])
    @ApiCookieAuth("apiKeyCookie")
    @ApiOperation({
        summary: "Analyze selected emails",
        description:
            "Processes the specified emails (by UID) through the AI backend and moves them to the ai_analyzed folder.",
    })
    @ApiResponse({
        status: 200,
        description: "Analysis complete",
        type: AnalyzeSelectedResponseDto,
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    async analyzeSelected(
        @Body() dto: AnalyzeSelectedEmailsDto,
        @AuthUser() _user: { id: string },
    ): Promise<AnalyzeSelectedResponseDto> {
        const processedCount =
            await this.imapPollerService.analyzeSelectedEmails(dto.uids);
        return { processedCount, success: true };
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
            lastUid: 0,
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
                    lastUid: 0,
                },
                user.id,
            );

        return {
            processedCount,
            success: true,
        };
    }
}
