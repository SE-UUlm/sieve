import { PrismaClient } from "./client/client";
import { PrismaPg } from "@prisma/adapter-pg";

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
const prisma = new PrismaClient({ adapter: adapter, log: ["info", "query", "warn", "error"] });

async function main() {
    const alice = await prisma.user.upsert({
        where: { email: "alice@example.com" },
        update: {},
        create: {
            name: "Alice Smith",
            email: "alice@example.com",
        },
    });
    console.log({ alice });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async () => {
        await prisma.$disconnect();
        process.exit(1);
    });
