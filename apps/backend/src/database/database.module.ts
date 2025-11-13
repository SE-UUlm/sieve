import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../user/entities/user.entity";
import { Email } from "../email/entities/email.entity";
import { Job } from "../job/entities/job.entity";
import { JobResult } from "../job-result/entities/job-result.entity";
import { dataSourceOptions } from "./data-source";

@Module({
    imports: [
        TypeOrmModule.forRoot(dataSourceOptions),
        TypeOrmModule.forFeature([User, Email, Job, JobResult]),
    ],
    exports: [TypeOrmModule],
})
export class DatabaseModule {}
