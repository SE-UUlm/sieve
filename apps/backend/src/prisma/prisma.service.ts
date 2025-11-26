import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "../../prisma/client/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(private configService: ConfigService) {
        const username = configService.get<string>("DB_USERNAME")!;
        const password = configService.get<string>("DB_PASSWORD")!;
        const host = configService.get<string>("DB_HOST")!;
        const port = configService.get<number>("DB_PORT")!;
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
