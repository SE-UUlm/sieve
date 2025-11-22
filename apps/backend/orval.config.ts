import { defineConfig } from "orval";

export default defineConfig({
    sieve: {
        input: "openapi.json",
        output: {
            mode: "tags-split", // generate folder for each openapi tag
            workspace: "../../apps/frontend/src/lib/client",
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
