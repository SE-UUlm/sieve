import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/client/client";

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy
{
    constructor(configService: ConfigService) {
        // biome-ignore lint/style/noNonNullAssertion: config is validated on startup
        const username = configService.get<string>("DB_USERNAME")!;
        // biome-ignore lint/style/noNonNullAssertion: config is validated on startup
        const password = configService.get<string>("DB_PASSWORD")!;
        // biome-ignore lint/style/noNonNullAssertion: config is validated on startup
        const host = configService.get<string>("DB_HOST")!;
        // biome-ignore lint/style/noNonNullAssertion: config is validated on startup
        const port = configService.get<number>("DB_PORT")!;
        // biome-ignore lint/style/noNonNullAssertion: config is validated on startup
        const database = configService.get<string>("DB_NAME")!;

        const connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}`;
        const adapter = new PrismaPg({ connectionString: connectionString });

        super({ adapter: adapter, log: ["info", "query", "warn", "error"] });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
