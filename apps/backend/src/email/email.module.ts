import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiBackendModule } from "../ai-backend/ai-backend.module";
import { JobModule } from "../job/job.module";
import { PrismaModule } from "../prisma/prisma.module";
import { SmtpModule } from "../smtp/smtp.module";
import { EmailController } from "./email.controller";
import { EmailService } from "./email.service";

@Module({
    imports: [AiBackendModule, PrismaModule, SmtpModule, ConfigModule, JobModule],
    controllers: [EmailController],
    providers: [EmailService],
})
export class EmailModule {}
