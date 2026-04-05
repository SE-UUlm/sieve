import { BadRequestException } from "@nestjs/common";
import type { Prisma } from "../../prisma/client/client";

export type AnalysisFlowName = "simple" | "product";

export type AnalysisFlowConfig = {
    name: AnalysisFlowName;
    structured_response_schema: Record<string, unknown>;
    structured_response_prompt?: string;
    summary_prompt?: string;
    db_step_prompt?: string;
    email_response_prompt?: string;
};

export type AnalysisCategory = {
    name: string;
    description: string;
    flow: AnalysisFlowConfig;
};

export type AnalysisCategories = AnalysisCategory[];

export const DEFAULT_ANALYSIS_CATEGORIES: AnalysisCategories = [
    {
        name: "Complaint",
        description:
            "The user expresses dissatisfaction, frustration or complaints and is not product support",
        flow: {
            name: "simple",
            structured_response_schema: {
                properties: {
                    complaints: {
                        description: "Only one item per individual complaint",
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
                "Extract only explicit complaints. Keep each complaint short, factual, and non-duplicative.",
            summary_prompt:
                "Summarize only complaint-relevant details in concise plain text. Include concrete facts, customer impact, and requested resolution. Do not invent details.",
            email_response_prompt:
                "Acknowledge the issue empathetically and professionally. Apologize when appropriate. Provide the next concrete step; if key details are missing, ask only for those details. Never blame the customer.",
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
                                    description: "If not known, set to null",
                                    title: "Product Id",
                                },
                                product_category: {
                                    anyOf: [
                                        { type: "string" },
                                        { type: "null" },
                                    ],
                                    default: null,
                                    description: "If not known, set to null",
                                    title: "Product Category",
                                },
                                metadata: {
                                    type: "object",
                                    default: null,
                                    description: "If not known, leave empty",
                                    title: "Metadata",
                                },
                                price: {
                                    anyOf: [
                                        { type: "number" },
                                        { type: "null" },
                                    ],
                                    default: null,
                                    description: "If not known, set to null",
                                    title: "Price",
                                },
                            },
                            required: ["product_name", "quantity"],
                            title: "Product",
                            type: "object",
                        },
                        title: "Products",
                        type: "array",
                    },
                    urgency: {
                        description:
                            "How urgent is the inquiry from 0 (not urgent) to 100 (very urgent)",
                        title: "Urgency",
                        type: "integer",
                    },
                },
                required: ["products", "urgency"],
                title: "Product Inquiry",
                type: "object",
            },
            db_step_prompt:
                "Database hints: Records contain LEGO sets; product names are primarily German; metadata includes part count.",
            email_response_prompt:
                "Use related product matches and customer intent to draft a helpful reply. Ask for clarification only when product identity is still ambiguous after related information. If one product is clearly identified, do not ask which product they meant. Answer explicit product questions when related information supports it. For order placement requests, collect only missing required order details (for example name and address). Confirm placement only when the request and required details are present. If this category has nothing actionable, return null.",
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
                            product: { $ref: "#/$defs/Product" },
                            issue: {
                                description: "A short summary of the issue",
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
                        required: ["product", "issue", "urgency"],
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
                                anyOf: [{ type: "string" }, { type: "null" }],
                                default: null,
                                description: "If not known, set to null",
                                title: "Product Id",
                            },
                            product_category: {
                                anyOf: [{ type: "string" }, { type: "null" }],
                                default: null,
                                description: "If not known, set to null",
                                title: "Product Category",
                            },
                            metadata: {
                                anyOf: [{ type: "object" }, { type: "null" }],
                                default: null,
                                description: "If not known, set to null",
                                title: "Metadata",
                            },
                            price: {
                                anyOf: [{ type: "number" }, { type: "null" }],
                                default: null,
                                description: "If not known, set to null",
                                title: "Price",
                            },
                        },
                        required: ["product_name", "quantity"],
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
                "Database hints: Records contain LEGO sets; product names are primarily German; metadata includes part count.",
            summary_prompt:
                "Summarize support-relevant facts concisely: product, issue, symptoms, steps already tried, and urgency signals. Do not invent details.",
            email_response_prompt:
                "Respond with empathetic troubleshooting or support guidance grounded in available information. If a fix or next step is clear, state it. If required diagnostic details are missing, ask focused follow-up questions. Do not promise actions that are not supported by available information.",
        },
    },
    {
        name: "Other",
        description:
            "The email or a relevant concern in the email does not match any of the other categories.",
        flow: {
            name: "simple",
            structured_response_schema: {
                properties: { summary: { type: "string" } },
                required: ["summary"],
                type: "object",
                title: "Other",
            },
            summary_prompt:
                "Provide a concise plain-text summary of concerns that did not match other categories.",
            email_response_prompt:
                "Return null unless there is a clear, actionable reply for this category.",
        },
    },
];

/**
 * Ensures runtime categories payload has the minimal shape expected by ai-backend schemas.
 */
export function assertValidAnalysisCategoriesPayload(
    value: unknown,
): asserts value is AnalysisCategories {
    if (!Array.isArray(value)) {
        throw new BadRequestException(
            "Categories must be a JSON array of category objects.",
        );
    }

    if (value.length === 0) {
        throw new BadRequestException(
            "At least one category must be provided.",
        );
    }

    for (const [index, entry] of value.entries()) {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
            throw new BadRequestException(
                `Category at index ${index} must be an object.`,
            );
        }
        const category = entry as Record<string, unknown>;
        const name = category.name;
        const description = category.description;
        const flow = category.flow;

        if (typeof name !== "string" || name.trim().length === 0) {
            throw new BadRequestException(
                `Category at index ${index} must include a non-empty string 'name'.`,
            );
        }
        if (
            typeof description !== "string" ||
            description.trim().length === 0
        ) {
            throw new BadRequestException(
                `Category '${name}' must include a non-empty string 'description'.`,
            );
        }
        if (!flow || typeof flow !== "object" || Array.isArray(flow)) {
            throw new BadRequestException(
                `Category '${name}' must include an object 'flow'.`,
            );
        }

        const flowRecord = flow as Record<string, unknown>;
        const flowName = flowRecord.name;
        if (flowName !== "simple" && flowName !== "product") {
            throw new BadRequestException(
                `Category '${name}' has invalid flow.name. Expected 'simple' or 'product'.`,
            );
        }

        const structuredResponseSchema = flowRecord.structured_response_schema;
        if (
            !structuredResponseSchema ||
            typeof structuredResponseSchema !== "object" ||
            Array.isArray(structuredResponseSchema)
        ) {
            throw new BadRequestException(
                `Category '${name}' must include object flow.structured_response_schema.`,
            );
        }
    }
}

/**
 * Casts validated categories payload to Prisma JSON value.
 */
export function toPrismaCategoriesJson(
    categories: AnalysisCategories,
): Prisma.InputJsonValue {
    return categories as unknown as Prisma.InputJsonValue;
}
