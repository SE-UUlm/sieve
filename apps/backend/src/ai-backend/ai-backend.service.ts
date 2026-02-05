import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AiBackendService implements OnModuleInit {
    private aiBackendUrl!: string;

    constructor(private configService: ConfigService) {}

    onModuleInit() {
        // biome-ignore lint/style/noNonNullAssertion: config is validated on startup
        this.aiBackendUrl = this.configService.get<string>("AI_BACKEND_URL")!;
        if (!this.aiBackendUrl.endsWith("/")) {
            this.aiBackendUrl += "/";
        }

        Logger.log("AiBackend module initialized");
    }

    /**
     * Currently runs the temporary flow for processing a string of text.
     *
     * @param input The input string to process.
     * @returns The output of the AiBackend agent.
     */
    async runFlow(input: string) {
        try {
            Logger.log("Starting AiBackend execution...");

            const response = await fetch(`${this.aiBackendUrl}analyze-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ body: input }),
                signal: AbortSignal.timeout(30000),
            });

            Logger.log("AiBackend execution finished");

            if (!response.ok) {
                throw new Error(
                    `AiBackend returned an error ${response.status}`,
                );
            }

            const data = (await response.json()) as { data: string };

            return {
                message: JSON.stringify(data.data, null, "  "),
            };
        } catch (error) {
            Logger.error("Error running AiBackend agent:", error);

            throw new Error("Unknown error in AiBackend");
        }
    }
}
