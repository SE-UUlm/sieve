import { Module } from "@nestjs/common";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { AiBackendModule } from "./ai-backend/ai-backend.module";
import { AppConfigModule } from "./config/config.module";
import { EmailModule } from "./email/email.module";
import { HealthModule } from "./health/health.module";
import { JobModule } from "./job/job.module";
import { JobResultModule } from "./job-result/job-result.module";
import { auth } from "./lib/auth";
import { PrismaModule } from "./prisma/prisma.module";
import { UserModule } from "./user/user.module";

@Module({
    imports: [
        AppConfigModule,
        HealthModule,
        UserModule,
        JobModule,
        JobResultModule,
        EmailModule,
        PrismaModule,
        AuthModule.forRoot({ auth }),
        AiBackendModule,
    ],
})
export class AppModule {}
