import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Cron } from "@nestjs/schedule";
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
import type {
    InboxEmailBodyDto,
    InboxEmailDto,
    ListFoldersRequestDto,
} from "./dto";
import { ImapConfig, ImapService } from "./imap.service";

interface DetectedEmail {
    uid: number;
    subject: string;
    sender: string | null;
    body: string;
    messageId: string;
}

export interface NewImapEmailEvent {
    userId: string;
    emailId: string;
    subject: string | null;
}

@Injectable()
export class ImapPollerService {
    private readonly logger = new Logger(ImapPollerService.name);
    private isDetecting = false;
    private readonly processingUids = new Set<number>();
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
     * Polls the IMAP mailbox every 30 seconds for new emails.
     * Two-phase approach: detection (fast, IMAP connection) then processing (slow, AI).
     */
    @Cron("*/30 * * * * *")
    async pollImapMailbox(): Promise<void> {
        if (this.isDetecting) return;

        const config = await this.settingsService.getImapConfig();
        if (!config || !config.autoProcessEnabled) return;

        const status = await this.settingsService.getImapStatus();
        if (!status.isEnabled) return;

        // === PHASE 1: Detection (short, IMAP connection is open only here) ===
        this.isDetecting = true;
        let emailsToProcess: DetectedEmail[] = [];
        let maxUid = config.lastUid;
        try {
            const result = await this.detectNewEmails(config);
            emailsToProcess = result.emails;
            maxUid = result.maxUid;
            // Advance lastUid immediately so the next cron cycle doesn't re-detect
            if (maxUid > config.lastUid) {
                await this.prismaService.instanceSettings.update({
                    where: { id: "singleton" },
                    data: { imapLastUid: maxUid, imapLastSyncedAt: new Date() },
                });
            }
            // Mark all UIDs as in-progress before releasing the detection lock
            for (const email of emailsToProcess) {
                this.processingUids.add(email.uid);
            }
        } catch (error) {
            this.logger.error("IMAP detection failed:", error);
            return;
        } finally {
            this.isDetecting = false; // Release lock BEFORE AI analysis starts
        }

        if (emailsToProcess.length === 0) return;

        // === PHASE 2: Processing (long, no open IMAP connection) ===
        const adminUser = await this.prismaService.user.findFirst({
            where: { role: "ADMIN" },
        });
        if (!adminUser) {
            this.logger.warn("No admin user found for IMAP email processing");
            for (const email of emailsToProcess) {
                this.processingUids.delete(email.uid);
            }
            return;
        }

        for (const emailData of emailsToProcess) {
            try {
                await this.processDetectedEmail(emailData, config, adminUser.id);
            } catch (error) {
                this.logger.error(
                    `[AutoProcess] Failed for uid=${emailData.uid}: ${error instanceof Error ? error.message : String(error)}`,
                );
            } finally {
                this.processingUids.delete(emailData.uid);
            }
        }
    }

    /**
     * Ensures the AI-Analyzed folder exists, creating it if necessary.
     */
    private async ensureAnalyzedFolderExists(
        client: import("imapflow").ImapFlow,
    ): Promise<void> {
        this.analyzedFolderPath = this.ANALYZED_FOLDER;
        this.logger.log(
            `[Folder] Attempting to create folder "${this.analyzedFolderPath}"...`,
        );
        try {
            const result = await client.mailboxCreate(this.analyzedFolderPath);
            this.logger.log(`[Folder] Created: ${JSON.stringify(result)}`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.warn(`[Folder] mailboxCreate error (raw): "${msg}"`);
            if (
                msg.includes("exists") ||
                msg.includes("already") ||
                msg.includes("ALREADYEXISTS")
            ) {
                this.logger.log(`[Folder] Folder already exists – continuing`);
            } else {
                this.logger.warn(
                    `[Folder] Unexpected error – will still attempt moves`,
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
        this.logger.log(
            `[MOVE] Starting move for message ${uid} to ${folderPath}`,
        );

        try {
            // Keep connection alive before attempting move
            this.logger.log(`[MOVE] Sending NOOP to keep connection alive...`);
            await client.noop();
            this.logger.log(`[MOVE] NOOP succeeded`);

            // Step 1: COPY message to ai_analyzed folder
            this.logger.log(
                `[MOVE] Step 1: COPY message ${uid} to ${folderPath}...`,
            );
            const copyPromise = client.messageCopy(String(uid), folderPath, {
                uid: true,
            });
            const copyTimeout = new Promise((_, reject) =>
                setTimeout(
                    () => reject(new Error("COPY timeout after 10s")),
                    10000,
                ),
            );
            const copyResult = await Promise.race([copyPromise, copyTimeout]);
            this.logger.log(
                `[MOVE] COPY success: uid=${(copyResult as { uid?: unknown })?.uid ?? "?"}`,
            );

            // Step 2: DELETE original message (mark as deleted)
            this.logger.log(`[MOVE] Step 2: Mark message ${uid} as deleted...`);
            const deletePromise = client.messageDelete(String(uid), {
                uid: true,
            });
            const deleteTimeout = new Promise((_, reject) =>
                setTimeout(
                    () => reject(new Error("DELETE timeout after 10s")),
                    10000,
                ),
            );
            await Promise.race([deletePromise, deleteTimeout]);
            this.logger.log(
                `[MOVE] DELETE success - message ${uid} moved to ${folderPath}`,
            );
        } catch (error) {
            this.logger.error(
                `[MOVE] FAILED for uid ${uid}: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error; // Re-throw so caller knows it failed
        }
    }

    /**
     * Detection phase: opens a short-lived IMAP connection, fetches emails with
     * UID greater than the stored lastUid, closes the connection, and returns
     * the collected emails together with the highest seen UID.
     */
    private async detectNewEmails(
        config: ImapConfig,
    ): Promise<{ emails: DetectedEmail[]; maxUid: number }> {
        const ImapClient = (await import("imapflow")).ImapFlow;

        const client = new ImapClient({
            host: config.host.trim(),
            port: config.port,
            secure: config.security === "ssl",
            tls:
                config.security === "starttls"
                    ? { rejectUnauthorized: false }
                    : undefined,
            auth: { user: config.username, pass: config.password },
            logger: false,
        });
        client.on("error", (err: Error) => {
            this.logger.error(
                `[ImapFlow] Socket error in detectNewEmails: ${err.message}`,
            );
        });

        try {
            await client.connect();
            const mailboxInfo = await client.mailboxOpen(config.mailbox, {
                readOnly: true,
            });

            if (mailboxInfo.exists === 0) {
                await client.logout();
                return { emails: [], maxUid: config.lastUid };
            }

            const lastUid = config.lastUid;
            const uidRange = `${lastUid + 1}:*`;

            const detected: DetectedEmail[] = [];
            let maxUid = lastUid;

            const messages = await client.fetch(
                uidRange,
                {
                    uid: true,
                    envelope: true,
                    source: true,
                    text: true,
                    html: true,
                } as unknown as import("imapflow").FetchQueryObject,
                { uid: true },
            );

            for await (const message of messages) {
                if (!message.uid) continue;
                if (message.uid <= lastUid) continue;
                if (this.processingUids.has(message.uid)) continue;

                if (message.uid > maxUid) maxUid = message.uid;

                const messageId = message.envelope?.messageId || "";
                if (messageId) {
                    const existing = await this.prismaService.email.findFirst({
                        where: {
                            source: EmailSource.IMAP,
                            body: { contains: messageId },
                        },
                    });
                    if (existing) continue;
                }

                detected.push({
                    uid: message.uid,
                    subject: decodeMailHeader(
                        message.envelope?.subject || "",
                    ),
                    sender: message.envelope?.from?.[0]?.address ?? null,
                    body: decodeQuotedPrintable(
                        this.extractTextContent(message),
                    ),
                    messageId,
                });
            }

            await client.logout();
            return { emails: detected, maxUid };
        } catch (error) {
            try {
                await client.logout();
            } catch {
                /* ignore */
            }
            throw error;
        }
    }

    /**
     * Processing phase for a single detected email: AI analysis, DB transaction,
     * move to ai_analyzed (with fresh IMAP connection), then emit notification.
     */
    private async processDetectedEmail(
        emailData: DetectedEmail,
        config: ImapConfig,
        userId: string,
    ): Promise<void> {
        // AI analysis runs here — no IMAP connection is open
        const analysisResult = await this.aiBackendService.runFlow(
            emailData.body,
            emailData.subject,
        );
        const now = new Date();

        let emailId = "";
        await this.prismaService.$transaction(async (tx) => {
            const email = await tx.email.create({
                data: {
                    userId,
                    sender: emailData.sender,
                    subject: emailData.subject,
                    body: emailData.body,
                    source: EmailSource.IMAP,
                },
            });
            emailId = email.id;

            const job = await tx.job.create({
                data: {
                    userId,
                    emailId: email.id,
                    status: JobStatus.COMPLETED,
                    startedAt: now,
                    completedAt: now,
                },
            });

            await tx.jobResult.create({
                data: {
                    jobId: job.id,
                    status: JobResultStatus.SUCCESS,
                    output: analysisResult as unknown as Prisma.InputJsonValue,
                },
            });
        });

        // Move using a fresh IMAP connection — no socket timeout risk
        try {
            await this.moveEmailWithFreshConnection(config, emailData.uid);
        } catch (moveError) {
            this.logger.warn(
                `[AutoProcess] Could not move uid=${emailData.uid}: ${moveError instanceof Error ? moveError.message : String(moveError)}`,
            );
        }

        // Emit notification after the move attempt (success or failure)
        this.eventEmitter.emit("imap.email.received", {
            userId,
            emailId,
            subject: emailData.subject,
        } as NewImapEmailEvent);

        this.logger.log(
            `[AutoProcess] Processed uid=${emailData.uid}: ${emailData.subject || "(no subject)"}`,
        );
    }

    /**
     * Opens a short-lived dedicated IMAP connection solely to move a single
     * message to the ai_analyzed folder (COPY + DELETE).
     * Using a fresh connection avoids socket timeout after long AI analysis.
     */
    private async moveEmailWithFreshConnection(
        config: ImapConfig,
        uid: number,
    ): Promise<void> {
        const ImapClient = (await import("imapflow")).ImapFlow;

        const client = new ImapClient({
            host: config.host.trim(),
            port: config.port,
            secure: config.security === "ssl",
            tls:
                config.security === "starttls"
                    ? { rejectUnauthorized: false }
                    : undefined,
            auth: { user: config.username, pass: config.password },
            logger: false,
        });
        client.on("error", (err: Error) => {
            this.logger.error(
                `[ImapFlow] Socket error in moveEmailWithFreshConnection: ${err.message}`,
            );
        });

        try {
            await client.connect();
            await this.ensureAnalyzedFolderExists(client);
            await client.mailboxOpen(config.mailbox);
            await this.moveMessageToAnalyzedFolder(client, uid);
            await client.logout();
        } catch (error) {
            try {
                await client.logout();
            } catch {
                /* ignore */
            }
            throw error;
        }
    }

    /**
     * Returns the highest UID currently present in the mailbox, or 0 if empty.
     * Used to initialise imapLastUid when enabling auto-processing so that
     * existing emails are not re-processed.
     */
    async getMailboxMaxUid(config: ImapConfig): Promise<number> {
        const ImapClient = (await import("imapflow")).ImapFlow;

        const client = new ImapClient({
            host: config.host.trim(),
            port: config.port,
            secure: config.security === "ssl",
            tls:
                config.security === "starttls"
                    ? { rejectUnauthorized: false }
                    : undefined,
            auth: { user: config.username, pass: config.password },
            logger: false,
        });
        client.on("error", (err: Error) => {
            this.logger.error(
                `[ImapFlow] Socket error in getMailboxMaxUid: ${err.message}`,
            );
        });

        try {
            await client.connect();
            const mailboxInfo = await client.mailboxOpen(config.mailbox, {
                readOnly: true,
            });

            if (mailboxInfo.exists === 0) {
                await client.logout();
                return 0;
            }

            // Fetch only the last message to get its UID
            let maxUid = 0;
            const messages = await client.fetch(
                "*",
                { uid: true } as unknown as import("imapflow").FetchQueryObject,
            );
            for await (const message of messages) {
                if (message.uid && message.uid > maxUid) {
                    maxUid = message.uid;
                }
            }

            await client.logout();
            return maxUid;
        } catch (error) {
            this.logger.error(
                `[getMailboxMaxUid] Failed: ${error instanceof Error ? error.message : String(error)}`,
            );
            try {
                await client.logout();
            } catch {
                /* ignore */
            }
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
        client.on("error", (err: Error) => {
            this.logger.error(`[ImapFlow] Socket error in getMailboxMessageCount: ${err.message}`);
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
    async processExistingEmails(
        config: ImapConfig,
        _userId: string,
    ): Promise<number> {
        const ImapClient = (await import("imapflow")).ImapFlow;

        this.logger.log(
            `[Import] Starting – host=${config.host.trim()} port=${config.port} security=${config.security} mailbox=${config.mailbox}`,
        );

        const client = new ImapClient({
            host: config.host.trim(),
            port: config.port,
            secure: config.security === "ssl",
            tls:
                config.security === "starttls"
                    ? { rejectUnauthorized: false }
                    : undefined,
            auth: { user: config.username, pass: config.password },
            logger: false,
        });
        client.on("error", (err: Error) => {
            this.logger.error(`[ImapFlow] Socket error in processExistingEmails: ${err.message}`);
        });

        try {
            this.logger.log(`[Import] Connecting...`);
            await client.connect();
            this.logger.log(`[Import] Connected`);

            await this.ensureAnalyzedFolderExists(client);

            this.logger.log(
                `[Import] Opening mailbox "${config.mailbox}" (readOnly: false)...`,
            );
            const mailboxInfo = await client.mailboxOpen(config.mailbox, {
                readOnly: false,
            });
            this.logger.log(
                `[Import] Mailbox open – exists=${mailboxInfo.exists} uidValidity=${mailboxInfo.uidValidity}`,
            );

            // Collect all UIDs first so we don't hold the iterator open during moves
            const uids: number[] = [];
            this.logger.log(`[Import] Fetching all UIDs...`);
            const messages = await client.fetch({ all: true }, {
                uid: true,
            } as unknown as import("imapflow").FetchQueryObject);
            for await (const message of messages) {
                if (message.uid) {
                    uids.push(message.uid);
                    this.logger.debug(`[Import] Found uid=${message.uid}`);
                }
            }
            this.logger.log(
                `[Import] Collected ${uids.length} UIDs: [${uids.join(", ")}]`,
            );

            let movedCount = 0;
            for (const uid of uids) {
                try {
                    await this.moveMessageToAnalyzedFolder(client, uid);
                    movedCount++;
                } catch (moveError) {
                    this.logger.warn(
                        `[Import] Could not move uid=${uid}: ${moveError instanceof Error ? moveError.message : String(moveError)}`,
                    );
                }
            }

            this.logger.log(`[Import] Logging out...`);
            await client.logout();
            this.logger.log(
                `[Import] Done – moved ${movedCount}/${uids.length} messages to "${this.ANALYZED_FOLDER}"`,
            );
            return movedCount;
        } catch (error) {
            this.logger.error(
                `[Import] Failed: ${error instanceof Error ? error.message : String(error)}`,
            );
            this.logger.error(error);
            try {
                await client.logout();
            } catch {
                /* ignore */
            }
            throw error;
        }
    }

    /**
     * Lists all available IMAP folders for the given credentials.
     * Used to populate the folder selection dialog before saving settings.
     */
    async listFolders(credentials: ListFoldersRequestDto): Promise<string[]> {
        const ImapClient = (await import("imapflow")).ImapFlow;

        const client = new ImapClient({
            host: credentials.host.trim(),
            port: credentials.port,
            secure: credentials.security === "ssl",
            tls:
                credentials.security === "starttls"
                    ? { rejectUnauthorized: false }
                    : undefined,
            auth: { user: credentials.username, pass: credentials.password },
            logger: false,
        });
        client.on("error", (err: Error) => {
            this.logger.error(`[ImapFlow] Socket error in listFolders: ${err.message}`);
        });

        try {
            await client.connect();
            const mailboxList = await client.list();
            const folders: string[] = mailboxList
                .map((m) => m.path)
                .filter((p): p is string => !!p && p !== this.ANALYZED_FOLDER);
            await client.logout();
            return folders;
        } catch (error) {
            this.logger.error(
                `[listFolders] Failed: ${error instanceof Error ? error.message : String(error)}`,
            );
            try {
                await client.logout();
            } catch {
                /* ignore */
            }
            throw error;
        }
    }

    /**
     * Returns metadata for all emails currently in the configured inbox folder.
     * Used to populate the IMAP view in the frontend.
     */
    async getInboxEmails(): Promise<InboxEmailDto[]> {
        const config = await this.settingsService.getImapConfig();
        if (!config) {
            return [];
        }

        const ImapClient = (await import("imapflow")).ImapFlow;

        const client = new ImapClient({
            host: config.host.trim(),
            port: config.port,
            secure: config.security === "ssl",
            tls:
                config.security === "starttls"
                    ? { rejectUnauthorized: false }
                    : undefined,
            auth: { user: config.username, pass: config.password },
            logger: false,
        });
        client.on("error", (err: Error) => {
            this.logger.error(`[ImapFlow] Socket error in getInboxEmails: ${err.message}`);
        });

        try {
            await client.connect();
            const mailboxInfo = await client.mailboxOpen(config.mailbox, {
                readOnly: true,
            });

            if (mailboxInfo.exists === 0) {
                await client.logout();
                return [];
            }

            const emails: InboxEmailDto[] = [];
            const messages = await client.fetch("1:*", {
                uid: true,
                envelope: true,
                internalDate: true,
            } as unknown as import("imapflow").FetchQueryObject);

            const autoProcessEnabledAt = config.autoProcessEnabledAt;

            for await (const message of messages) {
                if (!message.uid) continue;
                // When auto-process is enabled, hide emails that arrived after the activation
                // timestamp — they will be (or already are) auto-processed by the cron job.
                if (
                    config.autoProcessEnabled &&
                    autoProcessEnabledAt &&
                    message.internalDate &&
                    message.internalDate >= autoProcessEnabledAt
                ) {
                    continue;
                }
                // Hide UIDs that are currently being processed (manual analyze in progress)
                if (this.processingUids.has(message.uid)) {
                    continue;
                }
                emails.push({
                    uid: message.uid,
                    subject: message.envelope?.subject
                        ? decodeMailHeader(message.envelope.subject)
                        : undefined,
                    sender: message.envelope?.from?.[0]?.address ?? undefined,
                    date: message.envelope?.date?.toISOString() ?? undefined,
                });
            }

            await client.logout();
            return emails;
        } catch (error) {
            this.logger.error(
                `[getInboxEmails] Failed: ${error instanceof Error ? error.message : String(error)}`,
            );
            try {
                await client.logout();
            } catch {
                /* ignore */
            }
            throw error;
        }
    }

    /**
     * Fetches the plain-text body of a single email by UID from the configured inbox.
     */
    async getEmailBody(uid: number): Promise<InboxEmailBodyDto> {
        const config = await this.settingsService.getImapConfig();
        if (!config) {
            throw new Error("IMAP is not configured");
        }

        const ImapClient = (await import("imapflow")).ImapFlow;

        const client = new ImapClient({
            host: config.host.trim(),
            port: config.port,
            secure: config.security === "ssl",
            tls:
                config.security === "starttls"
                    ? { rejectUnauthorized: false }
                    : undefined,
            auth: { user: config.username, pass: config.password },
            logger: false,
        });
        client.on("error", (err: Error) => {
            this.logger.error(`[ImapFlow] Socket error in getEmailBody: ${err.message}`);
        });

        try {
            await client.connect();
            await client.mailboxOpen(config.mailbox, { readOnly: true });

            let body = "";
            const fetchResult = await client.fetch(
                String(uid),
                {
                    uid: true,
                    text: true,
                    html: true,
                    source: true,
                } as unknown as import("imapflow").FetchQueryObject,
                { uid: true },
            );

            for await (const msg of fetchResult) {
                body = decodeQuotedPrintable(this.extractTextContent(msg));
                break;
            }

            await client.logout();
            return { uid, body };
        } catch (error) {
            this.logger.error(
                `[getEmailBody] Failed for uid=${uid}: ${error instanceof Error ? error.message : String(error)}`,
            );
            try {
                await client.logout();
            } catch {
                /* ignore */
            }
            throw error;
        }
    }

    /**
     * Processes a specific set of emails (by UID) through the AI backend
     * and moves them to the ai_analyzed folder.
     */
    async analyzeSelectedEmails(uids: number[]): Promise<number> {
        if (uids.length === 0) return 0;

        const config = await this.settingsService.getImapConfig();
        if (!config) {
            throw new Error("IMAP is not configured");
        }

        const adminUser = await this.prismaService.user.findFirst({
            where: { role: "ADMIN" },
        });
        if (!adminUser) {
            throw new Error("No admin user found");
        }

        const ImapClient = (await import("imapflow")).ImapFlow;

        const client = new ImapClient({
            host: config.host.trim(),
            port: config.port,
            secure: config.security === "ssl",
            tls:
                config.security === "starttls"
                    ? { rejectUnauthorized: false }
                    : undefined,
            auth: { user: config.username, pass: config.password },
            logger: false,
        });
        client.on("error", (err: Error) => {
            this.logger.error(`[ImapFlow] Socket error in analyzeSelectedEmails: ${err.message}`);
        });

        let processedCount = 0;

        for (const uid of uids) {
            this.processingUids.add(uid);
        }

        try {
            await client.connect();
            await this.ensureAnalyzedFolderExists(client);
            await client.mailboxOpen(config.mailbox);

            for (const uid of uids) {
                try {
                    // Fetch full message content
                    let fetchedMessage: {
                        uid?: number;
                        envelope?: import("imapflow").MessageEnvelopeObject;
                        text?: string;
                        html?: string;
                        source?: Buffer;
                    } | null = null;

                    const fetchResult = await client.fetch(
                        String(uid),
                        {
                            uid: true,
                            envelope: true,
                            source: true,
                            text: true,
                            html: true,
                        } as unknown as import("imapflow").FetchQueryObject,
                        { uid: true },
                    );

                    for await (const msg of fetchResult) {
                        fetchedMessage = msg;
                        break;
                    }

                    if (!fetchedMessage) {
                        this.logger.warn(
                            `[analyzeSelected] Message uid=${uid} not found`,
                        );
                        continue;
                    }

                    // Skip if already in DB
                    const messageId = fetchedMessage.envelope?.messageId || "";
                    if (messageId) {
                        const existing =
                            await this.prismaService.email.findFirst({
                                where: {
                                    source: EmailSource.IMAP,
                                    body: { contains: messageId },
                                },
                            });
                        if (existing) {
                            this.logger.log(
                                `[analyzeSelected] uid=${uid} already processed – skipping`,
                            );
                            // Still move it to analyzed folder
                            try {
                                await this.moveMessageToAnalyzedFolder(
                                    client,
                                    uid,
                                );
                            } catch {
                                /* ignore */
                            }
                            continue;
                        }
                    }

                    const subject = decodeMailHeader(
                        fetchedMessage.envelope?.subject || "",
                    );
                    const sender =
                        fetchedMessage.envelope?.from?.[0]?.address ?? null;
                    const body = decodeQuotedPrintable(
                        this.extractTextContent(fetchedMessage),
                    );

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
                        },
                    );

                    try {
                        await this.moveMessageToAnalyzedFolder(client, uid);
                    } catch (moveError) {
                        this.logger.warn(
                            `[analyzeSelected] Could not move uid=${uid} to analyzed folder: ${moveError instanceof Error ? moveError.message : String(moveError)}`,
                        );
                    }

                    processedCount++;
                    this.logger.log(
                        `[analyzeSelected] Processed uid=${uid}: ${subject || "(no subject)"}`,
                    );
                } catch (error) {
                    this.logger.error(
                        `[analyzeSelected] Failed for uid=${uid}: ${error instanceof Error ? error.message : String(error)}`,
                    );
                } finally {
                    this.processingUids.delete(uid);
                }
            }

            // Update last synced timestamp
            await this.prismaService.instanceSettings.update({
                where: { id: "singleton" },
                data: { imapLastSyncedAt: new Date() },
            });

            await client.logout();
        } catch (error) {
            this.logger.error(
                `[analyzeSelected] Fatal: ${error instanceof Error ? error.message : String(error)}`,
            );
            uids.forEach((uid) => this.processingUids.delete(uid));
            try {
                await client.logout();
            } catch {
                /* ignore */
            }
            throw error;
        }

        return processedCount;
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
                /Content-Type:\s*text\/plain[\s\S]*?\r?\n\r?\n([\s\S]*?)(?:\r?\n--|$)/i,
            );
            if (textMatch) {
                return textMatch[1].trim().slice(0, 10000);
            }
            // Try to find text/html content and strip tags
            const htmlMatch = sourceStr.match(
                /Content-Type:\s*text\/html[\s\S]*?\r?\n\r?\n([\s\S]*?)(?:\r?\n--|$)/i,
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
