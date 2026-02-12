import { PrismaPg } from "@prisma/adapter-pg";
import { auth } from "../src/lib/auth";
import { PrismaClient } from "./client/client";

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

type SeedUser = {
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "USER";
};

async function ensureSeedUser(user: SeedUser) {
    const existing = await prisma.user.findUnique({
        where: { email: user.email },
        select: {
            id: true,
        },
    });

    if (!existing) {
        await auth.api.signUpEmail({
            body: {
                email: user.email,
                password: user.password,
                name: user.name,
            },
        });

        if (user.role === "ADMIN") {
            await prisma.user.update({
                where: { email: user.email },
                data: { role: "ADMIN" },
            });
        }

        console.log(`Seeded user ${user.email} (${user.role}).`);
        return;
    }
}

/**
 * Creates demo users when explicitly enabled via `SEED_DEMO_USERS=true`.
 * Seeding is idempotent and only inserts users that do not already exist.
 */
async function main() {
    if (!seedDemoUsers) {
        console.log(
            "Skipping demo user seeding (SEED_DEMO_USERS is not true).",
        );
        return;
    }

    const seedUsers: SeedUser[] = [
        {
            name: process.env.SEED_ADMIN_NAME ?? "Admin",
            email: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com",
            password: requireEnv("SEED_ADMIN_PASSWORD"),
            role: "ADMIN",
        },
        {
            name: process.env.SEED_USER_NAME ?? "Alice Smith",
            email: process.env.SEED_USER_EMAIL ?? "alice@example.com",
            password: requireEnv("SEED_USER_PASSWORD"),
            role: "USER",
        },
    ];

    for (const user of seedUsers) {
        await ensureSeedUser(user);
    }
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
