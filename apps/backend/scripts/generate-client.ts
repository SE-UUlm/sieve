import { writeFile } from "node:fs/promises";
import { NestFactory } from "@nestjs/core";
import type { OpenAPIObject } from "@nestjs/swagger";
import orval from "orval";
import { createDocument } from "../src/swagger.config";

const OPENAPI_PATH = "./openapi.json";

// OpenAPI parameter types (not exported from @nestjs/swagger)
interface ReferenceObject {
    $ref: string;
}

interface ParameterObject {
    name: string;
    in: string;
    required?: boolean;
    schema?: unknown;
}

type Parameter = ParameterObject | ReferenceObject;

/**
 * Type guard to check if a parameter is a ParameterObject (not a ReferenceObject).
 */
function isParameterObject(param: Parameter): param is ParameterObject {
    return "in" in param && "name" in param;
}

/**
 * Fixes missing path parameters in OpenAPI document.
 * This is a workaround for a bug in better-auth that generates paths like /callback/{id}
 * without defining the 'id' parameter.
 */
function fixPathParameters(document: OpenAPIObject): OpenAPIObject {
    if (!document.paths) {
        return document;
    }

    const fixedPaths = { ...document.paths };

    for (const [pathKey, pathItem] of Object.entries(fixedPaths)) {
        if (!pathItem) continue;

        // Extract path parameters from the path itself (e.g., /callback/{id} -> id)
        const pathParams = pathKey.match(/\{(\w+)\}/g);
        if (!pathParams) continue;

        const paramNames = pathParams.map((p) => p.slice(1, -1)); // Remove { and }

        // Check each HTTP method
        for (const method of [
            "get",
            "post",
            "put",
            "patch",
            "delete",
        ] as const) {
            const operation = pathItem[method];
            if (!operation) continue;

            const existingParams = (operation.parameters || []) as Parameter[];
            const pathParams = existingParams
                .filter(isParameterObject)
                .filter((p) => p.in === "path");
            const existingParamNames = new Set(pathParams.map((p) => p.name));

            // Add missing path parameters
            for (const paramName of paramNames) {
                if (!existingParamNames.has(paramName)) {
                    console.log(
                        `  Fixing missing path parameter '${paramName}' for ${method.toUpperCase()} ${pathKey}`,
                    );
                    existingParams.push({
                        name: paramName,
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    });
                }
            }

            (operation as { parameters?: Parameter[] }).parameters =
                existingParams;
        }
    }

    return { ...document, paths: fixedPaths };
}

/**
 * Bootstraps a NestJS application instance for OpenAPI generation.
 *
 * @returns The NestJS application instance.
 */
async function bootstrapNestApp() {
    // Set env before import
    process.env.GENERATE_OPENAPI = "true";

    const { AppModule } = await import("../src/app.module.js");

    return await NestFactory.create(AppModule, {
        logger: ["error", "warn"],
    });
}

/**
 * Generates the OpenAPI spec and client code using Orval.
 */
async function generateClient() {
    try {
        console.log("Starting OpenAPI Client Generation...");

        // 1. Generate OpenAPI Spec from NestJS
        const app = await bootstrapNestApp();
        let document = await createDocument(app);
        await app.close();
        console.log("✔ NestJS App context closed");

        // 2. Fix missing path parameters (workaround for better-auth bug)
        console.log("Fixing OpenAPI path parameters...");
        document = fixPathParameters(document);

        // 3. Write OpenAPI JSON
        const jsonContent = JSON.stringify(document, null, 2);
        await writeFile(OPENAPI_PATH, jsonContent);
        console.log(`✔ OpenAPI spec written to ${OPENAPI_PATH}`);

        // 4. Generate Client with Orval
        console.log("⚙Running Orval...");
        await orval();
        console.log("✔ Orval generation finished");

        process.exit(0);
    } catch (error) {
        console.error("Error generating client:", error);
        process.exit(1);
    }
}

void generateClient();
