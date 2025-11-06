import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { User } from "../user/entities/user.entity";
import { Email } from "../email/entities/email.entity";
import { Job } from "../job/entities/job.entity";
import { JobResult } from "../job-result/entities/job-result.entity";

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
