import { defineConfig } from "orval";

const orvalWorkspace =
    process.env.ORVAL_WORKSPACE ?? "../../apps/frontend/src/lib/client";

export default defineConfig({
    sieve: {
        input: "openapi.json",
        output: {
            mode: "tags-split", // generate folder for each openapi tag
            workspace: orvalWorkspace,
            target: ".",
            schemas: "models",
            client: "react-query",
            mock: {
                delay: 500,
                type: "msw",
            },
            httpClient: "fetch",
            clean: true,
            baseUrl: "/api",
        },
    },
});
