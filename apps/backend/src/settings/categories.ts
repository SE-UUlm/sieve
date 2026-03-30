import { BadRequestException } from "@nestjs/common";
import type { Prisma } from "../../prisma/client/client";

export type AnalysisFlowName = "simple" | "product";

export type AnalysisFlowConfig = {
    name: AnalysisFlowName;
    structured_response_schema: Record<string, unknown>;
    structured_response_prompt?: string | null;
    summary_prompt?: string | null;
    db_step_prompt?: string | null;
    email_response_prompt?: string | null;
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
            structured_response_prompt: "Be extremely concise.",
            summary_prompt:
                "Include every little detail of the complaint. Answer in French.",
            email_response_prompt:
                "In the response tell the customer that it's their fault and be rude.",
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
                "Database hints: The database only contains lego sets. The metadata column contains the part count. The products in the database are named in german",
            email_response_prompt:
                "If no matching product is found, please tell the customer that you could not find it and ask which product exactly they were referring to. \nIf there are multiple ask to clarify which one the customers want.\nIf the customer has questions that can be answered based on the related information, answer it.\nIf the customer has no questions and wants to immediately place the order: The following information is needed: Name, Address. If those are not provided, ask the customer. Else tell the customer that the order is placed.\nIf nothing of the above matches, do not respond.",
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
                "Database hints: The database only contains lego sets. The metadata column contains the part count. The products in the database are named in german",
            summary_prompt:
                "Answer in German. In sehr kurzen Stichworten antworten, mit Komma getrennt.",
            email_response_prompt:
                "If the complaint is reasonable, answer that you are sorry and that we will fix it as soon as possible.",
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
            summary_prompt: "Be extremely concise. Answer in English",
            email_response_prompt: "Do not respond.",
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
