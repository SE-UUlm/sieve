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
            const isApiKeyEnabled =
                await this.settingsService.isProviderEnabled(provider);

            if (!apiKey || !apiKey.trim()) {
                throw new ServiceUnavailableException(
                    `${provider} API key is not configured for this instance.`,
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
                        simple_model: "gpt-4o-mini",
                        complex_model: "gpt-5.2",
                    },
                    categories: [
                        {
                            name: "Complaint",
                            description:
                                "The user expresses dissatisfaction, frustration or complaints and is not product support",
                            flow: {
                                name: "simple",
                                structured_response_schema: {
                                    properties: {
                                        complaints: {
                                            description:
                                                "Only one item per individual complaint",
                                            items: { type: "string" },
                                            type: "array",
                                        },
                                        urgency: {
                                            description:
                                                "How urgent is the complaint from 0 (not urgent) to 100 (very urgent)",
                                            title: "Urgency",
                                            type: "integer",
                                        },
                                    },
                                    required: ["complaints", "urgency"],
                                    type: "object",
                                },
                                structured_response_prompt:
                                    "Be extremely concise. List every complaint twice. Once in English, once in French",
                                summary_prompt:
                                    "Include every little detail of the complaint. Answer in French.",
                            },
                        },
                        {
                            name: "Product Inquiry",
                            description:
                                "The user wants to order a product or wants to ask for information regarding a product they do not yet own or wants suggestion which product(s) to buy.",
                            flow: {
                                name: "product",
                                structured_response_schema: {
                                    properties: {
                                        products: {
                                            description:
                                                "List all Products from 'Related Products'",
                                            items: {
                                                description:
                                                    "Use the provided 'related products' to fill out the products, or if not matching, fill out only name and quantity with the user provided info.",
                                                properties: {
                                                    product_name: {
                                                        title: "Product Name",
                                                        type: "string",
                                                    },
                                                    quantity: {
                                                        title: "Quantity",
                                                        type: "integer",
                                                    },
                                                    product_id: {
                                                        anyOf: [
                                                            { type: "string" },
                                                            { type: "null" },
                                                        ],
                                                        default: null,
                                                        description:
                                                            "If not known, set to null",
                                                        title: "Product Id",
                                                    },
                                                    product_category: {
                                                        anyOf: [
                                                            { type: "string" },
                                                            { type: "null" },
                                                        ],
                                                        default: null,
                                                        description:
                                                            "If not known, set to null",

                                                        title: "Product Category",
                                                    },
                                                    metadata: {
                                                        type: "object",
                                                        default: null,
                                                        description:
                                                            "If not known, leave empty",
                                                        title: "Metadata",
                                                    },
                                                    price: {
                                                        anyOf: [
                                                            { type: "number" },
                                                            { type: "null" },
                                                        ],
                                                        default: null,
                                                        description:
                                                            "If not known, set to null",

                                                        title: "Price",
                                                    },
                                                },
                                                required: [
                                                    "product_name",
                                                    "quantity",
                                                ],
                                                title: "Product",
                                                type: "object",
                                            },
                                            title: "Products",
                                            type: "array",
                                        },
                                        question: {
                                            anyOf: [
                                                { type: "string" },
                                                { type: "null" },
                                            ],
                                            default: null,
                                            title: "Question",
                                        },
                                        answer: {
                                            anyOf: [
                                                { type: "string" },
                                                { type: "null" },
                                            ],
                                            default: null,
                                            description:
                                                "If the customer asked a question and you can answer the question based on the provided product details, then answer here",
                                            title: "Answer",
                                        },
                                        urgency: {
                                            description:
                                                "How urgent is the complaint from 0 (not urgent) to 100 (very urgent)",
                                            title: "Urgency",
                                            type: "integer",
                                        },
                                    },
                                    required: ["products", "urgency"],
                                    title: "Product Inquiry",
                                    type: "object",
                                },
                                db_step_prompt:
                                    "Database hints: The database only contains lego sets. The metadata column contains the part count. The products in the database are named in german",
                            },
                        },
                        {
                            name: "Product Support",
                            description:
                                "The user asks about an existing product they already have or use.",
                            flow: {
                                name: "product",
                                structured_response_schema: {
                                    $defs: {
                                        Issue: {
                                            properties: {
                                                product: {
                                                    $ref: "#/$defs/Product",
                                                },
                                                issue: {
                                                    description:
                                                        "A short summary of the issue",
                                                    title: "Issue",
                                                    type: "string",
                                                },
                                                urgency: {
                                                    description:
                                                        "How urgent is the complaint from 0 (not urgent) to 100 (very urgent)",
                                                    title: "Urgency",
                                                    type: "integer",
                                                },
                                            },
                                            required: [
                                                "product",
                                                "issue",
                                                "urgency",
                                            ],
                                            title: "Issue",
                                            type: "object",
                                        },
                                        Product: {
                                            description:
                                                "Use the provided 'related products' to fill out the products, or if not matching, fill out only name and quantity with the user provided info.",
                                            properties: {
                                                product_name: {
                                                    title: "Product Name",
                                                    type: "string",
                                                },
                                                quantity: {
                                                    title: "Quantity",
                                                    type: "integer",
                                                },
                                                product_id: {
                                                    anyOf: [
                                                        { type: "string" },
                                                        { type: "null" },
                                                    ],
                                                    default: null,
                                                    description:
                                                        "If not known, set to null",
                                                    title: "Product Id",
                                                },
                                                product_category: {
                                                    anyOf: [
                                                        { type: "string" },
                                                        { type: "null" },
                                                    ],
                                                    default: null,
                                                    description:
                                                        "If not known, set to null",
                                                    title: "Product Category",
                                                },
                                                metadata: {
                                                    anyOf: [
                                                        { type: "object" },
                                                        { type: "null" },
                                                    ],
                                                    default: null,
                                                    description:
                                                        "If not known, set to null",
                                                    title: "Metadata",
                                                },
                                                price: {
                                                    anyOf: [
                                                        { type: "number" },
                                                        { type: "null" },
                                                    ],
                                                    default: null,
                                                    description:
                                                        "If not known, set to null",
                                                    title: "Price",
                                                },
                                            },
                                            required: [
                                                "product_name",
                                                "quantity",
                                            ],
                                            title: "Product",
                                            type: "object",
                                        },
                                    },
                                    properties: {
                                        issues: {
                                            items: { $ref: "#/$defs/Issue" },
                                            title: "Issues",
                                            type: "array",
                                        },
                                    },
                                    required: ["issues"],
                                    title: "Product Support",
                                    type: "object",
                                },
                                db_step_prompt:
                                    "Database hints: The database only contains lego sets. The metadata column contains the part count. The products in the database are named in german",
                                summary_prompt:
                                    "Answer in German. In sehr kurzen Stichworten antworten",
                            },
                        },
                        {
                            name: "Other",
                            description:
                                "The email or a relevant concern in the email does not match any of the other categories.",
                            flow: {
                                name: "simple",
                                structured_response_schema: {
                                    properties: {
                                        summary: {
                                            type: "string",
                                        },
                                    },
                                    required: ["summary"],
                                    type: "object",
                                    title: "Other",
                                },
                                summary_prompt:
                                    "Be extremely concise. Answer in English",
                            },
                        },
                    ],
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
