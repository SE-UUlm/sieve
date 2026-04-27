import { PrismaPg } from "@prisma/adapter-pg";
import { auth } from "../src/lib/auth";
import { PrismaClient } from "./client/client";
import { UserRole } from "./client/enums";

const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const host = process.env.DB_HOST;
const port = Number(process.env.DB_PORT);
const database = process.env.DB_NAME;

if (!username || !password || !host || !port || !database) {
    throw new Error("Missing DB configuration");
}

const connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}`;

const adapter = new PrismaPg({ connectionString: connectionString });
const prisma = new PrismaClient({
    adapter: adapter,
    log: ["info", "query", "warn", "error"],
});

const seedDemoUsers =
    process.env.SEED_DEMO_USERS?.trim().toLowerCase() === "true";

/**
 * Reads a required environment variable.
 *
 * @param name The variable name to resolve.
 * @returns The non-empty variable value.
 * @throws Error if the variable is missing or empty.
 */
function requireEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required env var: ${name}`);
    }

    return value;
}

type SeedUserConfig = {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    passwordEnvVar: "SEED_ADMIN_PASSWORD" | "SEED_USER_PASSWORD";
};

/**
 * Reads admin seed config from environment variables.
 *
 * `SEED_ADMIN_PASSWORD` is only required when creating the admin for the first
 * time. Existing admins can be reconciled without it.
 */
function readAdminSeedConfig(): SeedUserConfig {
    const email = requireEnv("SEED_ADMIN_EMAIL").trim().toLowerCase();
    const name = requireEnv("SEED_ADMIN_NAME").trim();
    const password = process.env.SEED_ADMIN_PASSWORD?.trim();

    return {
        name,
        email,
        password,
        role: UserRole.ADMIN,
        passwordEnvVar: "SEED_ADMIN_PASSWORD",
    };
}

/**
 * Reads default non-admin seed config from environment variables.
 *
 * Defaults to an "Alice" user if no explicit values are provided.
 * `SEED_USER_PASSWORD` is only required when creating the user for the first
 * time. Existing users can be reconciled without it.
 */
function readDefaultUserSeedConfig(): SeedUserConfig {
    const email = (process.env.SEED_USER_EMAIL ?? "alice@example.com")
        .trim()
        .toLowerCase();
    const name = (process.env.SEED_USER_NAME ?? "Alice Smith").trim();
    const password = process.env.SEED_USER_PASSWORD?.trim();

    if (!email) {
        throw new Error("SEED_USER_EMAIL cannot be empty.");
    }
    if (!name) {
        throw new Error("SEED_USER_NAME cannot be empty.");
    }

    return {
        name,
        email,
        password,
        role: UserRole.USER,
        passwordEnvVar: "SEED_USER_PASSWORD",
    };
}

/**
 * Ensures one configured seed user exists with the configured role.
 *
 * If no user exists for the configured email, one is created via Better Auth.
 * On every run, role and display name are reconciled to keep seeding idempotent.
 */
async function ensureSeedUser(config: SeedUserConfig) {
    const existing = await prisma.user.findUnique({
        where: { email: config.email },
        select: {
            id: true,
            role: true,
            name: true,
        },
    });

    if (!existing) {
        if (!config.password) {
            throw new Error(
                `Missing required env var: ${config.passwordEnvVar} (required when creating user ${config.email}).`,
            );
        }
        await auth.api.signUpEmail({
            body: {
                email: config.email,
                password: config.password,
                name: config.name,
            },
        });
        console.log(`Created ${config.role} user ${config.email}.`);
    }

    const existingOrCreated = await prisma.user.findUnique({
        where: { email: config.email },
        select: { role: true, name: true },
    });

    if (!existingOrCreated) {
        throw new Error(`Failed to load user ${config.email}`);
    }

    const updates: { role?: UserRole; name?: string } = {};
    if (existingOrCreated.role !== config.role) {
        updates.role = config.role;
    }
    if (existingOrCreated.name !== config.name) {
        updates.name = config.name;
    }

    if (Object.keys(updates).length > 0) {
        await prisma.user.update({
            where: { email: config.email },
            data: updates,
        });
        console.log(`Updated user profile for ${config.email}.`);
    }
}

async function main() {
    if (!seedDemoUsers) {
        console.log("Skipping user seeding (SEED_DEMO_USERS is not true).");
        return;
    }

    const adminConfig = readAdminSeedConfig();
    const defaultUserConfig = readDefaultUserSeedConfig();

    await ensureSeedUser(adminConfig);
    await ensureSeedUser(defaultUserConfig);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error) => {
        console.error("Database seeding failed.", error);
        await prisma.$disconnect();
        process.exit(1);
    });
