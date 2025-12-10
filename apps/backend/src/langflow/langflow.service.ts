import { LangflowClient } from "@datastax/langflow-client";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class LangflowService implements OnModuleInit {
    private client!: LangflowClient;

    constructor(private configService: ConfigService) {}

    onModuleInit() {
        const apiKey = this.configService.get<string>("LANGFLOW_API_KEY")!;
        const baseUrl = this.configService.get<string>("LANGFLOW_BASE_URL")!;

        this.client = new LangflowClient({ baseUrl, apiKey });
        Logger.log("Langflow client initialized");
    }

    /**
     * Currently runs the temporary flow for processing a string of text.
     *
     * @param input The input string to process.
     * @returns The output of the Langflow flow.
     */
    async runFlow(input: string) {
        const flowId = "a5112453-aa9b-454f-84ed-2de26ca7048c";

        try {
            Logger.log("Starting Langflow execution...");

            const flow = this.client.flow(flowId);
            const response = await flow.run(input);

            Logger.log("Langflow execution finished");

            return {
                raw: response,
                message: response.chatOutputText() ?? "No output",
            };
        } catch (error) {
            Logger.error("Error running Langflow flow:", error);

            throw new Error(error instanceof Error ? error.message : "Unknown error in Langflow");
        }
    }
}
