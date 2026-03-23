import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import type { Prisma } from "../../prisma/client/client";
import { JobResultStatus, JobStatus, EmailSource } from "../../prisma/client/enums";
import { AiBackendService } from "../ai-backend/ai-backend.service";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { ImapService, ImapConfig } from "./imap.service";
import { EventEmitter2 } from "@nestjs/event-emitter";

export interface NewImapEmailEvent {
    userId: string;
    emailId: string;
    subject: string | null;
}

@Injectable()
export class ImapPollerService {
    private readonly logger = new Logger(ImapPollerService.name);
    private isRunning = false;

    constructor(
        private readonly prismaService: PrismaService,
        private readonly settingsService: SettingsService,
        private readonly imapService: ImapService,
        private readonly eventEmitter: EventEmitter2,
        private readonly aiBackendService: AiBackendService,
    ) {}

    /**
     * Polls the IMAP mailbox every minute for new emails.
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async pollImapMailbox(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        const config = await this.settingsService.getImapConfig();
        if (!config) {
            return;
        }

        const status = await this.settingsService.getImapStatus();
        if (!status.isEnabled) {
            return;
        }

        this.isRunning = true;

        try {
            await this.checkForNewEmails(config);
        } catch (error) {
            this.logger.error("Error polling IMAP mailbox:", error);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Checks for new emails in the IMAP mailbox and processes them.
     */
    private async checkForNewEmails(config: ImapConfig): Promise<void> {
        const ImapClient = (await import("imapflow")).ImapFlow;

        const client = new ImapClient({
            host: config.host,
            port: config.port,
            secure: config.security === "ssl",
            tls: config.security === "starttls" ? { rejectUnauthorized: false } : undefined,
            auth: {
                user: config.username,
                pass: config.password,
            },
            logger: false,
        });

        try {
            await client.connect();

            // Get the last synced UID to avoid reprocessing
            const settings = await this.prismaService.instanceSettings.findUnique({
                where: { id: "singleton" },
                select: { imapLastSyncedAt: true },
            });

            const mailbox = await client.mailboxOpen(config.mailbox);

            // Search for unread messages
            const searchCriteria = settings?.imapLastSyncedAt
                ? { since: settings.imapLastSyncedAt }
                : { unseen: true };

            const messages = await client.fetch(searchCriteria, {
                uid: true,
                envelope: true,
                source: true,
            });

            let newEmailCount = 0;

            for await (const message of messages) {
                // Check if this email was already processed
                const messageId = message.envelope?.messageId || "";
                const existingEmail = await this.prismaService.email.findFirst({
                    where: {
                        source: EmailSource.IMAP,
                        body: {
                            contains: messageId,
                        },
                    },
                });

                if (existingEmail) {
                    continue;
                }

                // Get admin user for IMAP emails
                const adminUser = await this.prismaService.user.findFirst({
                    where: { role: "ADMIN" },
                });

                if (!adminUser) {
                    this.logger.warn("No admin user found for IMAP email processing");
                    continue;
                }

                // Parse email content
                const subject = message.envelope?.subject || null;
                const sender = message.envelope?.from?.[0]?.address || null;
                const body = message.source?.toString() || "";

                // Process email through AI backend and save results
                try {
                    const analysisResult = await this.aiBackendService.runFlow(body, subject);
                    const now = new Date();

                    await this.prismaService.$transaction(async (transaction) => {
                        const email = await transaction.email.create({
                            data: {
                                userId: adminUser.id,
                                sender,
                                subject,
                                body,
                                source: EmailSource.IMAP,
                            },
                        });

                        const job = await transaction.job.create({
                            data: {
                                userId: adminUser.id,
                                emailId: email.id,
                                status: JobStatus.COMPLETED,
                                startedAt: now,
                                completedAt: now,
                            },
                        });

                        await transaction.jobResult.create({
                            data: {
                                jobId: job.id,
                                status: JobResultStatus.SUCCESS,
                                output: analysisResult as unknown as Prisma.InputJsonValue,
                            },
                        });

                        newEmailCount++;

                        // Emit event for notification
                        this.eventEmitter.emit("imap.email.received", {
                            userId: adminUser.id,
                            emailId: email.id,
                            subject,
                        } as NewImapEmailEvent);

                        this.logger.log(`New IMAP email processed: ${subject || "(no subject)"}`);
                    });
                } catch (error) {
                    this.logger.error(`Failed to process IMAP email: ${subject || "(no subject)"}`, error);
                }
            }

            // Update last synced timestamp
            await this.prismaService.instanceSettings.update({
                where: { id: "singleton" },
                data: { imapLastSyncedAt: new Date() },
            });

            if (newEmailCount > 0) {
                this.logger.log(`Processed ${newEmailCount} new IMAP emails`);
            }

            await client.logout();
        } catch (error) {
            this.logger.error("Error checking IMAP mailbox:", error);
            throw error;
        }
    }

    /**
     * Gets the count of emails in the IMAP mailbox without marking them as read.
     */
    async getMailboxMessageCount(config: ImapConfig): Promise<number> {
        const ImapClient = (await import("imapflow")).ImapFlow;

        const client = new ImapClient({
            host: config.host,
            port: config.port,
            secure: config.security === "ssl",
            tls: config.security === "starttls" ? { rejectUnauthorized: false } : undefined,
            auth: {
                user: config.username,
                pass: config.password,
            },
            logger: false,
        });

        try {
            await client.connect();
            const mailbox = await client.mailboxOpen(config.mailbox, { readOnly: true });
            const count = mailbox.exists;
            await client.logout();
            return count;
        } catch (error) {
            this.logger.error("Error getting mailbox count:", error);
            throw error;
        }
    }

    /**
     * Processes existing emails from the IMAP mailbox.
     * Called when user confirms initial import.
     * Processes each email through AI backend and creates job results.
     */
    async processExistingEmails(config: ImapConfig, userId: string): Promise<number> {
        const ImapClient = (await import("imapflow")).ImapFlow;

        const client = new ImapClient({
            host: config.host,
            port: config.port,
            secure: config.security === "ssl",
            tls: config.security === "starttls" ? { rejectUnauthorized: false } : undefined,
            auth: {
                user: config.username,
                pass: config.password,
            },
            logger: false,
        });

        let processedCount = 0;

        try {
            await client.connect();
            await client.mailboxOpen(config.mailbox, { readOnly: true });

            // Fetch all messages
            const messages = await client.fetch({ all: true }, {
                uid: true,
                envelope: true,
                source: true,
            });

            for await (const message of messages) {
                // Check if already processed
                const messageId = message.envelope?.messageId || "";
                const existingEmail = await this.prismaService.email.findFirst({
                    where: {
                        source: EmailSource.IMAP,
                        body: {
                            contains: messageId,
                        },
                    },
                });

                if (existingEmail) {
                    continue;
                }

                const subject = message.envelope?.subject || null;
                const sender = message.envelope?.from?.[0]?.address || null;
                const body = message.source?.toString() || "";

                // Process email through AI backend
                try {
                    const analysisResult = await this.aiBackendService.runFlow(body, subject);
                    const now = new Date();

                    await this.prismaService.$transaction(async (transaction) => {
                        const email = await transaction.email.create({
                            data: {
                                userId,
                                sender,
                                subject,
                                body,
                                source: EmailSource.IMAP,
                            },
                        });

                        const job = await transaction.job.create({
                            data: {
                                userId,
                                emailId: email.id,
                                status: JobStatus.COMPLETED,
                                startedAt: now,
                                completedAt: now,
                            },
                        });

                        await transaction.jobResult.create({
                            data: {
                                jobId: job.id,
                                status: JobResultStatus.SUCCESS,
                                output: analysisResult as unknown as Prisma.InputJsonValue,
                            },
                        });

                        processedCount++;
                    });
                } catch (error) {
                    this.logger.error(`Failed to process email: ${subject || "(no subject)"}`, error);
                    // Continue with next email even if one fails
                }
            }

            await client.logout();
            return processedCount;
        } catch (error) {
            this.logger.error("Error processing existing emails:", error);
            throw error;
        }
    }
}
