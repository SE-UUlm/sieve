import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { AppConfigModule } from "./config/config.module";
import { UserModule } from "./user/user.module";
import { JobModule } from "./job/job.module";
import { JobResultModule } from "./job-result/job-result.module";
import { EmailModule } from "./email/email.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
    imports: [
        AppConfigModule,
        HealthModule,
        UserModule,
        JobModule,
        JobResultModule,
        EmailModule,
        PrismaModule,
    ],
})
export class AppModule {}
