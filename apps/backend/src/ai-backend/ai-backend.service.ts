import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { EmailAnalysisResultDto } from "../email/dto/email-analysis-result.dto";

@Injectable()
export class AiBackendService implements OnModuleInit {
    private aiBackendUrl!: string;

    constructor(private configService: ConfigService) {}

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

            const response = await fetch(`${this.aiBackendUrl}analyze-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ subject, body }),
                signal: AbortSignal.timeout(30000),
            });

            Logger.log("AiBackend execution finished");

            if (!response.ok) {
                throw new Error(
                    `AiBackend returned an error ${response.status}`,
                );
            }

            const data = (await response.json()) as {
                data: EmailAnalysisResultDto;
            };
            return data.data;
        } catch (error) {
            Logger.error("Error running AiBackend agent:", error);
            throw new Error("Unknown error in AiBackend");
        }
    }
}
