import { join, resolve } from "path";
import { writeFile, readFile, readdir, stat } from "fs/promises";
import { NestFactory } from "@nestjs/core";
import orval from "orval";
import * as prettier from "prettier";
import { createDocument } from "../src/swagger.config";

const OPENAPI_PATH = "./openapi.json";
const CLIENT_OUTPUT = "../frontend/src/lib/client";
const PRETTIER_CONFIG = "./.prettierrc";

/**
 * Handles all code formatting logic using the Prettier Node API.
 */
class CodeFormatter {
    private options: prettier.Options | null = null;

    constructor(private configPath: string) {}

    /**
     * Loads Prettier configuration once.
     */
    async init() {
        this.options = await prettier.resolveConfig(this.configPath);
    }

    /**
     * Formats a raw string content.
     *
     * @param content The content to format.
     * @param filepath The file path to infer parser from.
     */
    async formatContent(content: string, filepath: string): Promise<string> {
        if (!this.options) await this.init();

        // Inferred parser based on filepath is safer than hardcoding 'json'
        return prettier.format(content, {
            ...this.options,
            filepath,
        });
    }

    /**
     * Reads, formats, and writes a file back to disk.
     *
     * @param filePath The file path to format.
     */
    async formatFile(filePath: string): Promise<void> {
        try {
            const content = await readFile(filePath, "utf8");
            const formatted = await this.formatContent(content, filePath);
            await writeFile(filePath, formatted);
        } catch (error) {
            console.warn(`Failed to format ${filePath}:`, error);
        }
    }

    /**
     * Recursively formats a directory.
     *
     * @param dirPath The directory path to format.
     */
    async formatDirectory(dirPath: string): Promise<void> {
        try {
            const files = await readdir(dirPath);
            for (const file of files) {
                const fullPath = join(dirPath, file);
                const fileStat = await stat(fullPath);

                if (fileStat.isDirectory()) {
                    await this.formatDirectory(fullPath);
                } else if (/\.(ts|tsx|js|json)$/.test(file)) {
                    await this.formatFile(fullPath);
                }
            }
        } catch (error) {
            console.warn(`Error processing directory ${dirPath}:`, error);
        }
    }
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
    const formatter = new CodeFormatter(PRETTIER_CONFIG);

    try {
        console.log("Starting OpenAPI Client Generation...");
        await formatter.init();

        // 1. Generate OpenAPI Spec from NestJS
        const app = await bootstrapNestApp();
        const document = await createDocument(app);
        await app.close();
        console.log("✔ NestJS App context closed");

        // 2. Write formatted OpenAPI JSON
        const jsonContent = JSON.stringify(document);
        const formattedJson = await formatter.formatContent(jsonContent, OPENAPI_PATH);
        await writeFile(OPENAPI_PATH, formattedJson);
        console.log(`✔ OpenAPI spec written to ${OPENAPI_PATH}`);

        // 3. Generate Client with Orval
        console.log("⚙Running Orval...");
        await orval();
        console.log("✔ Orval generation finished");

        // 4. Format Generated Client Code
        console.log("Formatting generated files...");
        const clientDir = resolve(CLIENT_OUTPUT);
        await formatter.formatDirectory(clientDir);
        console.log(`✔ Formatted client code in ${CLIENT_OUTPUT}`);

        process.exit(0);
    } catch (error) {
        console.error("Error generating client:", error);
        process.exit(1);
    }
}

void generateClient();
