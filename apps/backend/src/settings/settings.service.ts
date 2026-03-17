import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AIProvider } from "../../prisma/client/enums";
import { PrismaService } from "../prisma/prisma.service";
import {
    DEFAULT_AI_PROVIDER,
    getProviderDisplayName,
    SUPPORTED_AI_PROVIDERS,
} from "./providers";

const INSTANCE_SETTINGS_ID = "singleton";
const GCM_IV_LENGTH = 12;

type ProviderState = {
    isConfigured: boolean;
    isEnabled: boolean;
};

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

    getSupportedProviders(): readonly AIProvider[] {
        return SUPPORTED_AI_PROVIDERS;
    }

    /**
     * Gets the list of AI providers and their current state.
     *
     * @returns An array of objects containing provider information for admin settings display.
     */
    async getAdminProviderSettings(): Promise<
        Array<{
            provider: AIProvider;
            displayName: string;
            isConfigured: boolean;
            isEnabled: boolean;
        }>
    > {
        return await Promise.all(
            this.getSupportedProviders().map(async (provider) => {
                const state = await this.getProviderState(provider);
                return {
                    provider,
                    displayName: getProviderDisplayName(provider),
                    isConfigured: state.isConfigured,
                    isEnabled: state.isEnabled,
                };
            }),
        );
    }

    /**
     * Gets the list of AI providers that are selectable by the user.
     *
     * @returns An array of AI providers that are both configured and enabled.
     */
    async getSelectableProviders(): Promise<AIProvider[]> {
        const states = await Promise.all(
            this.getSupportedProviders().map(async (provider) => ({
                provider,
                state: await this.getProviderState(provider),
            })),
        );

        return states
            .filter(({ state }) => state.isConfigured && state.isEnabled)
            .map(({ provider }) => provider);
    }

    /**
     * Gets the default AI provider.
     *
     * @param selectableProviders The list of selectable providers.
     * @returns The default AI provider, or null if none is available.
     */
    getDefaultProvider(selectableProviders: AIProvider[]): AIProvider | null {
        if (selectableProviders.includes(DEFAULT_AI_PROVIDER)) {
            return DEFAULT_AI_PROVIDER;
        }

        return selectableProviders[0] ?? null;
    }

    /**
     * Gets the active AI provider, falling back to a default if necessary.
     *
     * @returns The active AI provider, or the default if none is active.
     */
    async getResolvedActiveProvider(): Promise<AIProvider> {
        const selectableProviders = await this.getSelectableProviders();
        const activeProvider = await this.getActiveProvider();

        if (selectableProviders.includes(activeProvider)) {
            return activeProvider;
        }

        const fallbackProvider =
            this.getDefaultProvider(selectableProviders) ?? DEFAULT_AI_PROVIDER;

        await this.setActiveProvider(fallbackProvider);
        return fallbackProvider;
    }

    /**
     * Gets the active AI provider.
     *
     * @returns The active AI provider.
     */
    async getActiveProvider(): Promise<AIProvider> {
        const settings = await this.prismaService.instanceSettings.findUnique({
            where: { id: INSTANCE_SETTINGS_ID },
            select: { activeProvider: true },
        });

        return settings?.activeProvider ?? DEFAULT_AI_PROVIDER;
    }

    /**
     * Sets the active AI provider.
     *
     * @param provider The AI provider to set as active.
     */
    async setActiveProvider(provider: AIProvider): Promise<void> {
        await this.prismaService.instanceSettings.upsert({
            where: { id: INSTANCE_SETTINGS_ID },
            create: {
                id: INSTANCE_SETTINGS_ID,
                activeProvider: provider,
            },
            update: {
                activeProvider: provider,
            },
        });
    }

    /**
     * Checks if a provider has an API key configured.
     *
     * @param provider The provider to check.
     * @returns True if the provider has an API key configured, false otherwise.
     */
    async hasProviderApiKey(provider: AIProvider): Promise<boolean> {
        const settings = await this.prismaService.providerSettings.findUnique({
            where: { provider },
            select: { apiKey: true },
        });

        return (settings?.apiKey?.trim().length ?? 0) > 0;
    }

    /**
     * Sets the API key for a provider.
     *
     * @param provider The provider to set the API key for.
     * @param apiKey The API key string.
     */
    async setProviderApiKey(
        provider: AIProvider,
        apiKey: string,
    ): Promise<void> {
        const encryptedApiKey = this.encryptApiKey(apiKey.trim());

        await this.prismaService.providerSettings.upsert({
            where: { provider },
            create: {
                provider,
                apiKey: encryptedApiKey,
                enabled: true,
            },
            update: {
                apiKey: encryptedApiKey,
                enabled: true,
            },
        });
    }

    /**
     * Gets the API key for a provider.
     *
     * @param provider The provider to get the API key for.
     * @returns The API key string, or null if not configured.
     */
    async getProviderApiKey(provider: AIProvider): Promise<string | null> {
        const settings = await this.prismaService.providerSettings.findUnique({
            where: { provider },
            select: { apiKey: true },
        });

        if (!settings?.apiKey) {
            return null;
        }

        return this.decryptApiKey(settings.apiKey);
    }

    /**
     * Checks if a provider is enabled.
     *
     * @param provider The provider to check.
     * @returns True if the provider is enabled, false otherwise.
     */
    async isProviderEnabled(provider: AIProvider): Promise<boolean> {
        const settings = await this.prismaService.providerSettings.findUnique({
            where: { provider },
            select: { enabled: true },
        });

        return settings?.enabled ?? false;
    }

    /**
     * Enables or disables a provider.
     *
     * @param provider The provider to enable or disable.
     * @param enabled Whether to enable or disable the provider.
     */
    async setProviderEnabled(
        provider: AIProvider,
        enabled: boolean,
    ): Promise<void> {
        await this.prismaService.providerSettings.upsert({
            where: { provider },
            create: {
                provider,
                enabled,
            },
            update: {
                enabled,
            },
        });
    }

    /**
     * Removes the configured API key for a provider and disables it.
     *
     * @param provider The provider to clear.
     */
    async clearProviderApiKey(provider: AIProvider): Promise<void> {
        await this.prismaService.providerSettings.upsert({
            where: { provider },
            create: {
                provider,
                apiKey: null,
                enabled: false,
            },
            update: {
                apiKey: null,
                enabled: false,
            },
        });
    }

    private async getProviderState(
        provider: AIProvider,
    ): Promise<ProviderState> {
        const [isConfigured, isEnabled] = await Promise.all([
            this.hasProviderApiKey(provider),
            this.isProviderEnabled(provider),
        ]);

        return {
            isConfigured,
            isEnabled,
        };
    }

    /**
     * Encrypts an API key before persisting it.
     *
     * @param plainTextKey Raw API key.
     * @returns Encrypted payload in `iv:ciphertext:authTag` format (base64-encoded).
     */
    private encryptApiKey(plainTextKey: string): string {
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
     * Decrypts a persisted API key.
     *
     * @param encryptedPayload Stored payload in `iv:ciphertext:authTag` format (base64-encoded).
     * @returns Decrypted API key string.
     */
    private decryptApiKey(encryptedPayload: string): string {
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
