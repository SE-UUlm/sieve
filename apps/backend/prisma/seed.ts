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

type SeedUser = {
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "USER";
};

const seedUsers: SeedUser[] = [
    {
        name: process.env.SEED_ADMIN_NAME ?? "Admin",
        email: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com",
        password: process.env.SEED_ADMIN_PASSWORD ?? "admin1234",
        role: "ADMIN",
    },
    {
        name: process.env.SEED_USER_NAME ?? "Alice Smith",
        email: process.env.SEED_USER_EMAIL ?? "alice@example.com",
        password: process.env.SEED_USER_PASSWORD ?? "alice1234",
        role: "USER",
    },
];

async function ensureSeedUser(user: SeedUser) {
    const existing = await prisma.user.findUnique({
        where: { email: user.email },
        select: {
            id: true,
            role: true,
            accounts: { select: { providerId: true } },
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

async function main() {
    for (const user of seedUsers) {
        await ensureSeedUser(user);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async () => {
        await prisma.$disconnect();
        process.exit(1);
    });
