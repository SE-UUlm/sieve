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
        this.analyzedFolderPath = this.ANALYZED_FOLDER;
        this.logger.log(`[Folder] Attempting to create folder "${this.analyzedFolderPath}"...`);
        try {
            const result = await client.mailboxCreate(this.analyzedFolderPath);
            this.logger.log(`[Folder] Created: ${JSON.stringify(result)}`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.warn(`[Folder] mailboxCreate error (raw): "${msg}"`);
            if (msg.includes("exists") || msg.includes("already") || msg.includes("ALREADYEXISTS")) {
                this.logger.log(`[Folder] Folder already exists – continuing`);
            } else {
                this.logger.warn(`[Folder] Unexpected error – will still attempt moves`);
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
            this.logger.log(`[MOVE] COPY success: uid=${(copyResult as { uid?: unknown })?.uid ?? "?"}`);
            
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
            host: config.host.trim(),
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
            host: config.host.trim(),
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
     * Moves all existing emails in the mailbox to the ai_analyzed folder.
     * Called on initial mail settings setup. No AI analysis – just move.
     */
    async processExistingEmails(config: ImapConfig, _userId: string): Promise<number> {
        const ImapClient = (await import("imapflow")).ImapFlow;

        this.logger.log(`[Import] Starting – host=${config.host.trim()} port=${config.port} security=${config.security} mailbox=${config.mailbox}`);

        const client = new ImapClient({
            host: config.host.trim(),
            port: config.port,
            secure: config.security === "ssl",
            tls: config.security === "starttls" ? { rejectUnauthorized: false } : undefined,
            auth: { user: config.username, pass: config.password },
            logger: false,
        });

        try {
            this.logger.log(`[Import] Connecting...`);
            await client.connect();
            this.logger.log(`[Import] Connected`);

            await this.ensureAnalyzedFolderExists(client);

            this.logger.log(`[Import] Opening mailbox "${config.mailbox}" (readOnly: false)...`);
            const mailboxInfo = await client.mailboxOpen(config.mailbox, { readOnly: false });
            this.logger.log(`[Import] Mailbox open – exists=${mailboxInfo.exists} uidValidity=${mailboxInfo.uidValidity}`);

            // Collect all UIDs first so we don't hold the iterator open during moves
            const uids: number[] = [];
            this.logger.log(`[Import] Fetching all UIDs...`);
            const messages = await client.fetch({ all: true }, { uid: true } as unknown as import("imapflow").FetchQueryObject);
            for await (const message of messages) {
                if (message.uid) {
                    uids.push(message.uid);
                    this.logger.debug(`[Import] Found uid=${message.uid}`);
                }
            }
            this.logger.log(`[Import] Collected ${uids.length} UIDs: [${uids.join(", ")}]`);

            let movedCount = 0;
            for (const uid of uids) {
                try {
                    await this.moveMessageToAnalyzedFolder(client, uid);
                    movedCount++;
                } catch (moveError) {
                    this.logger.warn(`[Import] Could not move uid=${uid}: ${moveError instanceof Error ? moveError.message : String(moveError)}`);
                }
            }

            this.logger.log(`[Import] Logging out...`);
            await client.logout();
            this.logger.log(`[Import] Done – moved ${movedCount}/${uids.length} messages to "${this.ANALYZED_FOLDER}"`);
            return movedCount;
        } catch (error) {
            this.logger.error(`[Import] Failed: ${error instanceof Error ? error.message : String(error)}`);
            this.logger.error(error);
            try { await client.logout(); } catch { /* ignore */ }
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
