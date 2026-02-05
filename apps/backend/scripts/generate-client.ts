import { writeFile } from "node:fs/promises";
import { NestFactory } from "@nestjs/core";
import orval from "orval";
import { createDocument } from "../src/swagger.config";

const OPENAPI_PATH = "./openapi.json";

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
        const document = await createDocument(app);
        await app.close();
        console.log("✔ NestJS App context closed");

        // 2. Write OpenAPI JSON
        const jsonContent = JSON.stringify(document, null, 2);
        await writeFile(OPENAPI_PATH, jsonContent);
        console.log(`✔ OpenAPI spec written to ${OPENAPI_PATH}`);

        // 3. Generate Client with Orval
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
