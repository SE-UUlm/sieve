import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const INSTANCE_SETTINGS_ID = "singleton";

@Injectable()
export class SettingsService {
    constructor(private readonly prismaService: PrismaService) {}

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
        await this.prismaService.instanceSettings.upsert({
            where: { id: INSTANCE_SETTINGS_ID },
            create: {
                id: INSTANCE_SETTINGS_ID,
                openAIApiKey: apiKey.trim(),
                openAIApiKeyEnabled: true,
            },
            update: {
                openAIApiKey: apiKey.trim(),
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

        return settings?.openAIApiKey ?? null;
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
}
