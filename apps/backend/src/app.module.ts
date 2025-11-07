import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { AppConfigModule } from "./config/config.module";
import { UserModule } from "./user/user.module";
import { JobModule } from "./job/job.module";
import { JobResultModule } from "./job-result/job-result.module";
import { EmailModule } from "./email/email.module";
import { AuthController } from "./auth/auth.controller";

@Module({
    imports: [AppConfigModule, DatabaseModule, UserModule, JobModule, JobResultModule, EmailModule],
    controllers: [AuthController],
})
export class AppModule {}
