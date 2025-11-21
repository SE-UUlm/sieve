import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { openAPI } from "better-auth/plugins";

const prisma = new PrismaService(new ConfigService());
export const auth = betterAuth({
    appName: "SIEVE",
    basePath: "/api/auth",
    trustedOrigins: ["http://localhost:3000"], // TODO: Make configurable via env
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
