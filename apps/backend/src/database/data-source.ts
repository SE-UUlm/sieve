import { config } from "dotenv";
import { DataSource, DataSourceOptions } from "typeorm";
import { User } from "../user/entities/user.entity";
import { Email } from "../email/entities/email.entity";
import { Job } from "../job/entities/job.entity";
import { JobResult } from "../job-result/entities/job-result.entity";

config();

export const dataSourceOptions: DataSourceOptions = {
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User, Email, Job, JobResult],
    synchronize: true, // TODO: disable in production
    logging: true,
};

export const dataSource = new DataSource(dataSourceOptions);
