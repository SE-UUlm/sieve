import "dotenv/config";
import { defineConfig, env } from "prisma/config";

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
