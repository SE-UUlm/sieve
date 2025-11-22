import { writeFile } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { NestFactory } from "@nestjs/core";
import orval from "orval";
import { createDocument } from "../src/swagger.config";

const execPromise = promisify(exec);

async function runPrettierCli(path: string) {
    try {
        const { stdout, stderr } = await execPromise(
            // force usage of backend prettierrc, even for client code in frontend,
            // because the plugin for windtail used in frontend prettierrc is not necessarly installed when developing the backend
            // Not really optimal if the frontend prettierrc will differ in the future but right now they are the same
            "npx prettier --log-level warn --config .prettierrc --write " + path,
        );

        if (stdout) {
            console.log(`Prettier ${path} (Stdout): \n${stdout}`);
        }

        if (stderr) {
            console.warn(`Prettier ${path} (Stderr): \n${stderr}`);
        }
    } catch (error) {
        console.error(`Error running Prettier CLI  ${path}:`);
        console.error(error);
        process.exit(1);
    }
}

export async function generateClient() {
    try {
        const promises = [];

        process.env.GENERATE_OPENAPI = "true";

        // Load AppModule dynamically to make its code run after setting the env variable
        const { AppModule } = await import("../src/app.module.js");

        const app = await NestFactory.create(AppModule, {
            logger: ["warn"],
        });
        const document = createDocument(app);

        const jsonDocument = JSON.stringify(document);
        await writeFile("./openapi.json", jsonDocument);

        // Close Nest App
        promises.push(app.close());

        promises.push(runPrettierCli("./openapi.json"));

        // Generate client
        await orval();

        // Option prettier: true in orval.config.ts was not working
        promises.push(runPrettierCli("../frontend/src/lib/client"));

        await Promise.all(promises);

        console.log("OpenAPI Spec and Client successfully generated");
    } catch (error) {
        console.error("Error generating client:", error);
        process.exit(1);
    }
}

generateClient();
