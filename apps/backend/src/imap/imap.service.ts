import { Injectable } from "@nestjs/common";
import { SettingsService } from "../settings/settings.service";

export interface ImapConfig {
    host: string;
    port: number;
    username: string;
    password: string;
    security: "ssl" | "starttls" | "none";
    mailbox: string;
    lastUid: number;
    autoSendThreshold: number | null;
}

export interface ImapStatus {
    isConnected: boolean;
    lastError?: string;
    lastSyncedAt?: Date;
    messageCount?: number;
}

@Injectable()
export class ImapService {
    constructor(private readonly settingsService: SettingsService) {}

    /**
     * Tests the IMAP connection with the provided configuration.
     * @param config - The IMAP configuration to test
     * @returns The connection status
     */
    async testConnection(config: ImapConfig): Promise<ImapStatus> {
        try {
            // Dynamic import to avoid loading imap module if not needed
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

            await client.connect();
            const mailbox = await client.mailboxOpen(config.mailbox);
            const messageCount = mailbox.exists;
            await client.logout();

            return {
                isConnected: true,
                messageCount,
            };
        } catch (error) {
            return {
                isConnected: false,
                lastError:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            };
        }
    }

    /**
     * Gets the current IMAP configuration from settings.
     * @returns The IMAP configuration or null if not configured
     */
    async getConfig(): Promise<ImapConfig | null> {
        return this.settingsService.getImapConfig();
    }

    /**
     * Gets the current IMAP connection status from stored settings.
     * @returns The IMAP status
     */
    async getStatus(): Promise<ImapStatus> {
        return this.settingsService.getImapStatus();
    }
}
