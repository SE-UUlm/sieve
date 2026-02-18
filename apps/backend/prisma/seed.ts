import { PrismaPg } from "@prisma/adapter-pg";
import { auth } from "../src/lib/auth";
import { PrismaClient } from "./client/client";
import { JobResultStatus, JobStatus } from "./client/enums";

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
const seedDemoHistory =
    process.env.SEED_DEMO_HISTORY?.trim().toLowerCase() === "true";
const DEMO_HISTORY_SENDER = "demo-history@sieve.local";

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

type DemoHistoryEntry = {
    subject: string;
    body: string;
    result: {
        category: "Other" | "Complaint" | "Product_Inquiry" | "Product_Support";
        summary?: string;
        complaints?: string[];
        products?: Array<{ product_name: string; quantity: number }>;
        issues?: Array<{ product_name: string; issue: string }>;
    };
};

const demoHistoryEntries: DemoHistoryEntry[] = [
    {
        subject: "Defekter Hydraulikzylinder nach 2 Wochen",
        body: "Hallo Team, der Zylinder HZ-300 verliert Öl nach kurzer Laufzeit. Bitte prüfen Sie Gewährleistung und Ersatz.",
        result: {
            category: "Complaint",
            complaints: [
                "Oil leakage after short runtime",
                "Request for replacement under warranty",
            ],
            summary:
                "Customer reports a leaking hydraulic cylinder and requests warranty handling.",
        },
    },
    {
        subject: "Anfrage: Verfügbarkeit von Ventilblöcken",
        body: "Wir benötigen 12x Ventilblock VB-12 und 4x VB-08 für ein Projekt im März. Bitte Lieferzeit bestätigen.",
        result: {
            category: "Product_Inquiry",
            products: [
                { product_name: "Ventilblock VB-12", quantity: 12 },
                { product_name: "Ventilblock VB-08", quantity: 4 },
            ],
            summary:
                "Customer asks for availability and lead time for two valve block products.",
        },
    },
    {
        subject: "Support: Drucksensor zeigt falsche Werte",
        body: "Der Sensor DS-90 schwankt stark und meldet 0 bar trotz Druck. Gibt es ein Firmware-Update oder Kalibrierung?",
        result: {
            category: "Product_Support",
            issues: [
                {
                    product_name: "Drucksensor DS-90",
                    issue: "Readings fluctuate and sometimes show 0 bar",
                },
            ],
            summary:
                "Customer needs troubleshooting steps for unstable pressure sensor readings.",
        },
    },
    {
        subject: "Allgemeine Frage zu Lieferbedingungen",
        body: "Können Sie uns Ihre Standard-Lieferbedingungen und die typischen Versandzeiten in die Schweiz senden?",
        result: {
            category: "Other",
            summary:
                "Customer asks for standard delivery terms and shipping times.",
        },
    },
    {
        subject: "Reklamation: Falsche Menge geliefert",
        body: "Bestellt waren 20 Dichtungen, geliefert wurden nur 16. Bitte kurzfristig nachliefern.",
        result: {
            category: "Complaint",
            complaints: ["Short shipment: 4 units missing"],
            summary: "Customer reports missing quantity in delivered order.",
        },
    },
];

/**
 * Ensures a seed user exists and has the expected role.
 *
 * If the user does not exist, it is created via Better Auth.
 * On every run, the role is reconciled to keep seeding idempotent.
 */
async function ensureSeedUser(user: SeedUser) {
    const existing = await prisma.user.findUnique({
        where: { email: user.email },
        select: {
            id: true,
            role: true,
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
        console.log(`Seeded user ${user.email} (${user.role}).`);
    }

    // Re-read after potential sign-up to reconcile role for both new and existing users.
    const existingOrCreated = await prisma.user.findUnique({
        where: { email: user.email },
        select: { role: true },
    });

    if (!existingOrCreated) {
        throw new Error(`Failed to load seeded user ${user.email}`);
    }

    if (existingOrCreated.role !== user.role) {
        await prisma.user.update({
            where: { email: user.email },
            data: { role: user.role },
        });
        console.log(`Updated role for ${user.email} to ${user.role}.`);
    }
}

/**
 * Seeds demo history entries for a user once.
 *
 * Uses a dedicated sender marker to avoid duplicate insertions across seed runs.
 */
async function ensureDemoHistoryForUser(userId: string, userEmail: string) {
    const existingDemoEntryCount = await prisma.email.count({
        where: {
            userId,
            sender: DEMO_HISTORY_SENDER,
        },
    });

    if (existingDemoEntryCount > 0) {
        console.log(`Skipping demo history for ${userEmail} (already seeded).`);
        return;
    }

    for (const entry of demoHistoryEntries) {
        await prisma.$transaction(async (transaction) => {
            const now = new Date();
            const email = await transaction.email.create({
                data: {
                    userId,
                    sender: DEMO_HISTORY_SENDER,
                    subject: entry.subject,
                    body: entry.body,
                },
            });

            const job = await transaction.job.create({
                data: {
                    userId,
                    emailId: email.id,
                    status: JobStatus.COMPLETED,
                    startedAt: now,
                    completedAt: now,
                },
            });

            await transaction.jobResult.create({
                data: {
                    jobId: job.id,
                    status: JobResultStatus.SUCCESS,
                    output: entry.result,
                },
            });
        });
    }

    console.log(
        `Seeded ${demoHistoryEntries.length} demo history entries for ${userEmail}.`,
    );
}

/**
 * Creates demo users when explicitly enabled via `SEED_DEMO_USERS=true`.
 * Seeding is idempotent and only inserts users that do not already exist.
 */
async function main() {
    let seededUserEmail =
        process.env.SEED_USER_EMAIL?.trim().toLowerCase() ??
        "alice@example.com";

    if (!seedDemoUsers) {
        console.log(
            "Skipping demo user seeding (SEED_DEMO_USERS is not true).",
        );
    } else {
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

        seededUserEmail = (process.env.SEED_USER_EMAIL ?? "alice@example.com")
            .trim()
            .toLowerCase();
    }

    if (!seedDemoHistory) {
        console.log(
            "Skipping demo history seeding (SEED_DEMO_HISTORY is not true).",
        );
        return;
    }

    const targetUser = await prisma.user.findUnique({
        where: { email: seededUserEmail },
        select: { id: true, email: true },
    });

    if (!targetUser) {
        throw new Error(
            `Cannot seed demo history: user ${seededUserEmail} not found.`,
        );
    }

    await ensureDemoHistoryForUser(targetUser.id, targetUser.email);
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
