import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiBackendModule } from "../ai-backend/ai-backend.module";
import { SmtpModule } from "../smtp/smtp.module";
import { EmailController } from "./email.controller";

@Module({
    imports: [AiBackendModule, SmtpModule, ConfigModule],
    controllers: [EmailController],
})
export class EmailModule {}
