import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { User } from "../entities/user.entity";
import { Email } from "../entities/email.entity";
import { Job } from "../entities/job.entity";
import { JobResult } from "../entities/jobResult.entity";

@Module({
    imports: [
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
                entities: [User, Email, Job, JobResult],
                logging: true,
            }),
        }),
        TypeOrmModule.forFeature([User, Email, Job, JobResult]),
    ],
    exports: [TypeOrmModule],
})
export class DatabaseModule {}
