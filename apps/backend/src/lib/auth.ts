import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { openAPI } from "better-auth/plugins";

const configService = new ConfigService();
const trustedOriginsEnv = configService.get<string>("TRUSTED_ORIGINS");
const trustedOrigins = trustedOriginsEnv
    ? trustedOriginsEnv.split(",").map((origin) => origin.trim())
    : ["http://localhost:3000"];
const prisma = new PrismaService(configService);
export const auth = betterAuth({
    appName: "SIEVE",
    basePath: "/api/auth",
    trustedOrigins: trustedOrigins,
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    plugins: [openAPI({ disableDefaultReference: true })],
    user: {
        modelName: "User",
        additionalFields: {
            role: {
                type: "string",
                input: false,
            },
        },
    },
    session: {
        modelName: "Session",
    },
    account: {
        modelName: "Account",
    },
    verification: {
        modelName: "Verification",
    },
});
