import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

loadEnv();

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "tsx --env-file=.env prisma/seed.ts",
    },
    datasource: {
        url: `postgresql://${env("DB_USERNAME")}:${env("DB_PASSWORD")}@${env("DB_HOST")}:${env("DB_PORT")}/${env("DB_NAME")}`,
    },
});
