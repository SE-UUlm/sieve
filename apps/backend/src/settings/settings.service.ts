import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

const INSTANCE_SETTINGS_ID = "singleton";
const GCM_IV_LENGTH = 12;

@Injectable()
export class SettingsService {
    private readonly encryptionKey: Buffer;

    constructor(
        private readonly prismaService: PrismaService,
        configService: ConfigService,
    ) {
        const encryptionKeyBase64 = configService.get<string>(
            "SETTINGS_ENCRYPTION_KEY",
        );

        if (!encryptionKeyBase64) {
            if (process.env.GENERATE_OPENAPI === "true") {
                this.encryptionKey = Buffer.alloc(32, 0);
                return;
            }
            throw new Error("Missing SETTINGS_ENCRYPTION_KEY configuration.");
        }

        this.encryptionKey = Buffer.from(encryptionKeyBase64, "base64");
        if (this.encryptionKey.length !== 32) {
            throw new Error(
                "SETTINGS_ENCRYPTION_KEY must decode to 32 bytes (base64).",
            );
        }
    }

    /**
     * Returns whether an instance-level OpenAI API key is configured.
     *
     * @returns True when a non-empty API key exists.
     */
    async hasOpenAIApiKey(): Promise<boolean> {
        const settings = await this.prismaService.instanceSettings.findUnique({
            where: { id: INSTANCE_SETTINGS_ID },
            select: { openAIApiKey: true },
        });

        return (settings?.openAIApiKey?.trim().length ?? 0) > 0;
    }

    /**
     * Stores the instance-level OpenAI API key.
     *
     * @param apiKey The new API key to persist.
     * @returns Nothing.
     */
    async setOpenAIApiKey(apiKey: string): Promise<void> {
        const encryptedApiKey = this.encryptOpenAIApiKey(apiKey.trim());

        await this.prismaService.instanceSettings.upsert({
            where: { id: INSTANCE_SETTINGS_ID },
            create: {
                id: INSTANCE_SETTINGS_ID,
                openAIApiKey: encryptedApiKey,
                openAIApiKeyEnabled: true,
            },
            update: {
                openAIApiKey: encryptedApiKey,
                openAIApiKeyEnabled: true,
            },
        });
    }

    /**
     * Loads the configured OpenAI API key for this instance.
     *
     * @returns The configured API key or null if none exists.
     */
    async getOpenAIApiKey(): Promise<string | null> {
        const settings = await this.prismaService.instanceSettings.findUnique({
            where: { id: INSTANCE_SETTINGS_ID },
            select: { openAIApiKey: true },
        });

        if (!settings?.openAIApiKey) {
            return null;
        }

        return this.decryptOpenAIApiKey(settings.openAIApiKey);
    }

    /**
     * Reads whether the configured OpenAI API key is enabled for usage.
     *
     * @returns True when key usage is enabled.
     */
    async isOpenAIApiKeyEnabled(): Promise<boolean> {
        const settings = await this.prismaService.instanceSettings.findUnique({
            where: { id: INSTANCE_SETTINGS_ID },
            select: { openAIApiKeyEnabled: true },
        });

        return settings?.openAIApiKeyEnabled ?? false;
    }

    /**
     * Updates the OpenAI API key usage flag.
     *
     * @param enabled Indicates whether key usage should be enabled.
     * @returns Nothing.
     */
    async setOpenAIApiKeyEnabled(enabled: boolean): Promise<void> {
        await this.prismaService.instanceSettings.upsert({
            where: { id: INSTANCE_SETTINGS_ID },
            create: {
                id: INSTANCE_SETTINGS_ID,
                openAIApiKeyEnabled: enabled,
            },
            update: {
                openAIApiKeyEnabled: enabled,
            },
        });
    }

    /**
     * Removes the configured OpenAI API key from instance settings.
     *
     * @returns Nothing.
     */
    async clearOpenAIApiKey(): Promise<void> {
        await this.prismaService.instanceSettings.upsert({
            where: { id: INSTANCE_SETTINGS_ID },
            create: {
                id: INSTANCE_SETTINGS_ID,
                openAIApiKey: null,
                openAIApiKeyEnabled: false,
            },
            update: {
                openAIApiKey: null,
                openAIApiKeyEnabled: false,
            },
        });
    }

    /**
     * Encrypts an OpenAI API key before persistence.
     *
     * @param plainTextKey Raw API key.
     * @returns Encrypted payload in `iv:ciphertext:authTag` base64 format.
     */
    private encryptOpenAIApiKey(plainTextKey: string): string {
        const iv = randomBytes(GCM_IV_LENGTH);
        const cipher = createCipheriv("aes-256-gcm", this.encryptionKey, iv);
        const encrypted = Buffer.concat([
            cipher.update(plainTextKey, "utf8"),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();

        return `${iv.toString("base64")}:${encrypted.toString("base64")}:${authTag.toString("base64")}`;
    }

    /**
     * Decrypts a persisted OpenAI API key.
     *
     * @param encryptedPayload Stored payload in `iv:ciphertext:authTag` base64 format.
     * @returns Decrypted API key string.
     */
    private decryptOpenAIApiKey(encryptedPayload: string): string {
        const parts = encryptedPayload.split(":");

        // Backward-compatible fallback for legacy plaintext records.
        if (parts.length !== 3) {
            return encryptedPayload;
        }

        const [ivBase64, encryptedBase64, authTagBase64] = parts;
        const iv = Buffer.from(ivBase64, "base64");
        const encrypted = Buffer.from(encryptedBase64, "base64");
        const authTag = Buffer.from(authTagBase64, "base64");

        const decipher = createDecipheriv(
            "aes-256-gcm",
            this.encryptionKey,
            iv,
        );
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]);

        return decrypted.toString("utf8");
    }
}
