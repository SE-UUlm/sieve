import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Cron, CronExpression } from "@nestjs/schedule";
import type { Prisma } from "../../prisma/client/client";
import {
    EmailSource,
    JobResultStatus,
    JobStatus,
} from "../../prisma/client/enums";
import { AiBackendService } from "../ai-backend/ai-backend.service";
import { decodeMailHeader, decodeQuotedPrintable } from "../lib/mail-encoding";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { ImapConfig, ImapService } from "./imap.service";

export interface NewImapEmailEvent {
    userId: string;
    emailId: string;
    subject: string | null;
}

@Injectable()
export class ImapPollerService {
    private readonly logger = new Logger(ImapPollerService.name);
    private isRunning = false;
    private readonly ANALYZED_FOLDER = "ai_analyzed";
    private analyzedFolderPath: string | null = null;

    constructor(
        private readonly prismaService: PrismaService,
        private readonly settingsService: SettingsService,
        readonly _imapService: ImapService,
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
     * Ensures the AI-Analyzed folder exists, creating it if necessary.
     */
    private async ensureAnalyzedFolderExists(
        client: import("imapflow").ImapFlow,
    ): Promise<void> {
        try {
            // Store the folder path for later use
            this.analyzedFolderPath = this.ANALYZED_FOLDER;
            await client.mailboxCreate(this.analyzedFolderPath);
            this.logger.log(`Created folder: ${this.analyzedFolderPath}`);
        } catch (error) {
            // Folder might already exist, which is fine
            if (error instanceof Error && 
                (error.message?.includes("exists") || error.message?.includes("already"))) {
                this.logger.log(`Folder ${this.ANALYZED_FOLDER} already exists`);
            } else {
                this.logger.warn(
                    `Could not create analyzed folder: ${error instanceof Error ? error.message : String(error)}`,
                );
            }
        }
    }

    /**
     * Checks if a message is in the AI-Analyzed folder.
     * Note: For Gmail, checks labels. For other providers (GMX, etc.),
     * we rely on the database check since we can't easily check folder membership.
     */
    private isMessageInAnalyzedFolder(message: {
        labels?: Set<string>;
    }): boolean {
        // For Gmail, check labels
        if (message.labels) {
            return message.labels.has(this.ANALYZED_FOLDER);
        }
        // For non-Gmail providers (GMX, etc.), labels don't exist
        // We can't easily check folder membership here, so we rely on DB check
        return false;
    }

    /**
     * Moves a message to the AI-Analyzed folder using COPY+DELETE.
     * Note: MOVE command is not supported by all servers (e.g., GMX), so we use COPY+DELETE.
     */
    private async moveMessageToAnalyzedFolder(
        client: import("imapflow").ImapFlow,
        uid: number,
    ): Promise<void> {
        const folderPath = this.analyzedFolderPath || this.ANALYZED_FOLDER;
        this.logger.log(`[MOVE] Starting move for message ${uid} to ${folderPath}`);
        
        try {
            // Keep connection alive before attempting move
            this.logger.log(`[MOVE] Sending NOOP to keep connection alive...`);
            await client.noop();
            this.logger.log(`[MOVE] NOOP succeeded`);
            
            // Step 1: COPY message to ai_analyzed folder
            this.logger.log(`[MOVE] Step 1: COPY message ${uid} to ${folderPath}...`);
            const copyPromise = client.messageCopy(String(uid), folderPath, { uid: true });
            const copyTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('COPY timeout after 10s')), 10000)
            );
            const copyResult = await Promise.race([copyPromise, copyTimeout]);
            this.logger.log(`[MOVE] COPY success: ${JSON.stringify(copyResult)}`);
            
            // Step 2: DELETE original message (mark as deleted)
            this.logger.log(`[MOVE] Step 2: Mark message ${uid} as deleted...`);
            const deletePromise = client.messageDelete(String(uid), { uid: true });
            const deleteTimeout = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('DELETE timeout after 10s')), 10000)
            );
            await Promise.race([deletePromise, deleteTimeout]);
            this.logger.log(`[MOVE] DELETE success - message ${uid} moved to ${folderPath}`);
        } catch (error) {
            this.logger.error(`[MOVE] FAILED for uid ${uid}: ${error instanceof Error ? error.message : String(error)}`);
            throw error; // Re-throw so caller knows it failed
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
            tls:
                config.security === "starttls"
                    ? { rejectUnauthorized: false }
                    : undefined,
            auth: {
                user: config.username,
                pass: config.password,
            },
            logger: false,
        });

        try {
            await client.connect();

            // Ensure the analyzed folder exists
            await this.ensureAnalyzedFolderExists(client);

            // Get the last synced UID to avoid reprocessing
            const settings =
                await this.prismaService.instanceSettings.findUnique({
                    where: { id: "singleton" },
                    select: { imapLastSyncedAt: true },
                });

            const _mailbox = await client.mailboxOpen(config.mailbox);

            // Search for unread messages
            const searchCriteria = settings?.imapLastSyncedAt
                ? { since: settings.imapLastSyncedAt }
                : { unseen: true };

            const messages = await client.fetch(searchCriteria, {
                uid: true,
                envelope: true,
                source: true,
                text: true,
                html: true,
            } as unknown as import("imapflow").FetchQueryObject);

            let newEmailCount = 0;

            for await (const message of messages) {
                // Skip messages that are already in the AI-Analyzed folder
                if (this.isMessageInAnalyzedFolder(message)) {
                    continue;
                }

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
                    this.logger.warn(
                        "No admin user found for IMAP email processing",
                    );
                    continue;
                }

                // Parse email content
                const subject = decodeMailHeader(
                    message.envelope?.subject || "",
                );
                const sender = message.envelope?.from?.[0]?.address || null;
                const body = decodeQuotedPrintable(
                    this.extractTextContent(message),
                );

                // Process email through AI backend and save results
                try {
                    const analysisResult = await this.aiBackendService.runFlow(
                        body,
                        subject,
                    );
                    const now = new Date();

                    await this.prismaService.$transaction(
                        async (transaction) => {
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

                            this.logger.log(
                                `New IMAP email processed: ${subject || "(no subject)"}`,
                            );

                            newEmailCount++;
                        },
                    );
                    
                    // Move the message to AI-Analyzed folder AFTER successful transaction
                    // Note: This happens outside the transaction so DB changes are preserved
                    // even if the move fails (e.g., due to connection issues with GMX)
                    if (message.uid) {
                        try {
                            await this.moveMessageToAnalyzedFolder(client, message.uid);
                        } catch (moveError) {
                            this.logger.warn(
                                `Could not move message ${message.uid} to analyzed folder, but email was processed: ${moveError instanceof Error ? moveError.message : String(moveError)}`,
                            );
                            // Continue - the email was already saved to DB
                        }
                    }
                } catch (error) {
                    this.logger.error(
                        `Failed to process IMAP email: ${subject || "(no subject)"}`,
                        error,
                    );
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
            tls:
                config.security === "starttls"
                    ? { rejectUnauthorized: false }
                    : undefined,
            auth: {
                user: config.username,
                pass: config.password,
            },
            logger: false,
        });

        try {
            await client.connect();
            const mailbox = await client.mailboxOpen(config.mailbox, {
                readOnly: true,
            });
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
     * Skips emails that are already in the AI-Analyzed folder.
     */
    async processExistingEmails(
        config: ImapConfig,
        userId: string,
    ): Promise<number> {
        const ImapClient = (await import("imapflow")).ImapFlow;

        const client = new ImapClient({
            host: config.host,
            port: config.port,
            secure: config.security === "ssl",
            tls:
                config.security === "starttls"
                    ? { rejectUnauthorized: false }
                    : undefined,
            auth: {
                user: config.username,
                pass: config.password,
            },
            logger: false,
        });

        let processedCount = 0;

        try {
            await client.connect();

            // Ensure the analyzed folder exists
            await this.ensureAnalyzedFolderExists(client);

            await client.mailboxOpen(config.mailbox, { readOnly: false });

            // Fetch all messages
            const messages = await client.fetch({ all: true }, {
                uid: true,
                envelope: true,
                source: true,
                text: true,
                html: true,
            } as unknown as import("imapflow").FetchQueryObject);

            let totalMessages = 0;
            for await (const message of messages) {
                totalMessages++;
                this.logger.debug(`Processing message ${totalMessages}: uid=${message.uid}, subject=${message.envelope?.subject?.substring(0, 50)}`);
                
                // Skip messages that are already in the AI-Analyzed folder
                if (this.isMessageInAnalyzedFolder(message)) {
                    this.logger.debug(`Skipping message ${message.uid} - already in analyzed folder (Gmail label)`);
                    continue;
                }

                // Check if already processed
                const messageId = message.envelope?.messageId || "";
                this.logger.debug(`Checking if message ${message.uid} (messageId=${messageId}) exists in DB...`);
                const existingEmail = await this.prismaService.email.findFirst({
                    where: {
                        source: EmailSource.IMAP,
                        body: {
                            contains: messageId,
                        },
                    },
                });

                if (existingEmail) {
                    this.logger.debug(`Skipping message ${message.uid} - already exists in DB`);
                    continue;
                }

                const subject = decodeMailHeader(
                    message.envelope?.subject || "",
                );
                const sender = message.envelope?.from?.[0]?.address || null;
                const body = decodeQuotedPrintable(
                    this.extractTextContent(message),
                );

                // Process email through AI backend
                try {
                    this.logger.log(`Starting AI analysis for: ${subject || "(no subject)"} (uid=${message.uid})`);
                    const analysisResult = await this.aiBackendService.runFlow(
                        body,
                        subject,
                    );
                    this.logger.log(`AI analysis completed for uid=${message.uid}`);
                    
                    const now = new Date();

                    this.logger.log(`Starting DB transaction for uid=${message.uid}...`);
                    await this.prismaService.$transaction(
                        async (transaction) => {
                            this.logger.log(`[TX] Creating email for uid=${message.uid}...`);
                            const email = await transaction.email.create({
                                data: {
                                    userId,
                                    sender,
                                    subject,
                                    body,
                                    source: EmailSource.IMAP,
                                },
                            });
                            this.logger.log(`[TX] Created email ${email.id}`);

                            this.logger.log(`[TX] Creating job for email ${email.id}...`);
                            const job = await transaction.job.create({
                                data: {
                                    userId,
                                    emailId: email.id,
                                    status: JobStatus.COMPLETED,
                                    startedAt: now,
                                    completedAt: now,
                                },
                            });
                            this.logger.log(`[TX] Created job ${job.id}`);

                            this.logger.log(`[TX] Creating job result for job ${job.id}...`);
                            await transaction.jobResult.create({
                                data: {
                                    jobId: job.id,
                                    status: JobResultStatus.SUCCESS,
                                    output: analysisResult as unknown as Prisma.InputJsonValue,
                                },
                            });
                            this.logger.log(`[TX] Created job result`);

                            processedCount++;
                        },
                    );
                    this.logger.log(`DB transaction COMMITTED for uid=${message.uid}`);
                    
                    // Note: We don't move messages during processExistingEmails because the IMAP connection
                    // may timeout during the AI analysis (which takes several seconds). 
                    // The messages will be moved during the next polling cycle (checkForNewEmails).
                    // The DB check (messageId) prevents double-processing.
                    this.logger.log(`Message ${message.uid} processed successfully. Will be moved during next poll cycle.`);
                } catch (error) {
                    this.logger.error(
                        `Failed to process email: ${subject || "(no subject)"}`,
                        error,
                    );
                    // Continue with next email even if one fails
                }
            }

            await client.logout();
            this.logger.log(`processExistingEmails completed. Total processed: ${processedCount}`);
            return processedCount;
        } catch (error) {
            this.logger.error("Error processing existing emails:", error);
            throw error;
        }
    }

    /**
     * Extracts plain text content from an IMAP message.
     * Falls back to HTML content if no plain text is available.
     * Strips HTML tags if only HTML content is available.
     */
    private extractTextContent(message: {
        text?: string;
        html?: string;
        source?: Buffer;
    }): string {
        // Prefer plain text content
        if (message.text) {
            return message.text.slice(0, 10000);
        }

        // Fall back to HTML content with tags stripped
        if (message.html) {
            return this.stripHtmlTags(message.html).slice(0, 10000);
        }

        // Last resort: try to extract from source
        if (message.source) {
            const sourceStr = message.source.toString();
            // Try to find text/plain content in MIME
            const textMatch = sourceStr.match(
                /Content-Type:\s*text\/plain[^]*?\r?\n\r?\n([^]*?)(?:\r?\n--|$)/i,
            );
            if (textMatch) {
                return textMatch[1].trim().slice(0, 10000);
            }
            // Try to find text/html content and strip tags
            const htmlMatch = sourceStr.match(
                /Content-Type:\s*text\/html[^]*?\r?\n\r?\n([^]*?)(?:\r?\n--|$)/i,
            );
            if (htmlMatch) {
                return this.stripHtmlTags(htmlMatch[1]).trim().slice(0, 10000);
            }
        }

        return "";
    }

    /**
     * Strips HTML tags from a string, preserving text content.
     */
    private stripHtmlTags(html: string): string {
        return html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }
}
