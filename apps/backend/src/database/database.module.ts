import { Logger, Module, OnModuleInit } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { databaseValidationSchema } from "../config/database.config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/user.entity";
import { DataSource } from "typeorm";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: databaseValidationSchema,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: "postgres",
                host: configService.get<string>("DB_HOST"),
                port: configService.get<number>("DB_PORT"),
                username: configService.get<string>("DB_USERNAME"),
                password: configService.get<string>("DB_PASSWORD"),
                database: configService.get<string>("DB_NAME"),
                entities: [User],
                autoLoadEntities: true,
            }),
        }),
    ],
})
export class DatabaseModule implements OnModuleInit {
    private readonly logger = new Logger(DatabaseModule.name);

    constructor(private readonly datasource: DataSource) {}

    async onModuleInit() {
        try {
            if (!this.datasource.isInitialized) {
                await this.datasource.initialize();
            }
            this.logger.log("Database connection established successfully.")
        } catch (err) {
            this.logger.error("Database connection failed", err);
            process.exit(1);
        }
    }
}
