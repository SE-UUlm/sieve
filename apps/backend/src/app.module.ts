import { Module } from "@nestjs/common";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { AiBackendModule } from "./ai-backend/ai-backend.module";
import { AppConfigModule } from "./config/config.module";
import { EmailModule } from "./email/email.module";
import { HealthModule } from "./health/health.module";
import { ImapModule } from "./imap/imap.module";
import { JobModule } from "./job/job.module";
import { JobResultModule } from "./job-result/job-result.module";
import { auth } from "./lib/auth";
import { NotificationsModule } from "./notifications/notifications.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SettingsModule } from "./settings/settings.module";
import { SmtpModule } from "./smtp/smtp.module";
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
        SettingsModule,
        AuthModule.forRoot({ auth }),
        AiBackendModule,
        SmtpModule,
        ImapModule,
        NotificationsModule,
    ],
})
export class AppModule {}
