import {
    BadGatewayException,
    HttpException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    Logger,
    OnModuleInit,
    ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EmailAnalysisResultDto } from "../email/dto/email-analysis-result.dto";
import { SettingsService } from "../settings/settings.service";

@Injectable()
export class AiBackendService implements OnModuleInit {
    private aiBackendUrl!: string;

    constructor(
        private configService: ConfigService,
        private settingsService: SettingsService,
    ) {}

    /**
     * Initializes the AI backend URL from configuration.
     */
    onModuleInit() {
        // biome-ignore lint/style/noNonNullAssertion: config is validated on startup
        this.aiBackendUrl = this.configService.get<string>("AI_BACKEND_URL")!;
        if (!this.aiBackendUrl.endsWith("/")) {
            this.aiBackendUrl += "/";
        }

        Logger.log("AiBackend module initialized");
    }

    /**
     * Executes the email analysis flow in the AI backend service.
     */
    async runFlow(
        body: string,
        subject?: string | null,
    ): Promise<EmailAnalysisResultDto> {
        try {
            Logger.log("Starting AiBackend execution...");
            const provider =
                await this.settingsService.getResolvedActiveProvider();
            const apiKey =
                await this.settingsService.getProviderApiKey(provider);
            const providerModels =
                await this.settingsService.getProviderModels(provider);
            const categories =
                await this.settingsService.getAnalysisCategories();
            const isApiKeyEnabled =
                await this.settingsService.isProviderEnabled(provider);
            const simpleModel = providerModels.simpleModel?.trim();
            const complexModel = providerModels.complexModel?.trim();

            if (!apiKey || !apiKey.trim()) {
                throw new ServiceUnavailableException(
                    `${provider} API key is not configured for this instance.`,
                );
            }
            if (!simpleModel || !complexModel) {
                throw new ServiceUnavailableException(
                    `${provider} models are not configured for this instance.`,
                );
            }
            if (!isApiKeyEnabled) {
                throw new HttpException(
                    `${provider} API key usage is disabled for this instance.`,
                    HttpStatus.LOCKED,
                );
            }

            const response = await fetch(`${this.aiBackendUrl}analyze-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: {
                        subject,
                        body,
                    },
                    model: {
                        provider,
                        api_key: apiKey,
                        simple_model: simpleModel,
                        complex_model: complexModel,
                    },
                    config: {
                        overall_email_response_prompt: `Use plain text only (no Markdown).
Reply in the customer's language.
Be polite, professional, and concise.
Keep the final email strictly grounded in the drafted email parts.
Do not address concerns that are not covered by drafted email parts.
Do not invent new facts, promises, or policy statements.
Use this closing signature:
SIEVE`,
                    },
                    categories,
                }),
                signal: AbortSignal.timeout(120000),
            });

            Logger.log("AiBackend execution finished");

            if (!response.ok) {
                Logger.error(
                    "AiBackend returned an error:",
                    response.status,
                    (await response.text()).slice(0, 200),
                );
                throw new BadGatewayException(
                    `AiBackend returned an error ${response.status}`,
                );
            }

            const data = (await response.json()) as {
                data: EmailAnalysisResultDto;
            };
            return data.data;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            Logger.error("Error running AiBackend agent:", error);
            throw new InternalServerErrorException(
                "Unknown error in AiBackend",
            );
        }
    }

    /**
     * Pings the AI backend base URL to check if the server is alive.
     *
     * @returns True if the server is reachable, false otherwise.
     */
    async ping(): Promise<boolean> {
        try {
            await fetch(this.aiBackendUrl, {
                method: "HEAD",
                signal: AbortSignal.timeout(5000), // 5s timeout
            });
            return true;
        } catch (error) {
            Logger.warn(`AI backend ping failed: ${error}`);
            return false;
        }
    }
}
