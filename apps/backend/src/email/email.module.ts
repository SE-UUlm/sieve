import { Module } from "@nestjs/common";
import { SmtpModule } from "src/smtp/smtp.module";
import { AiBackendModule } from "../ai-backend/ai-backend.module";
import { EmailController } from "./email.controller";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [AiBackendModule, SmtpModule, ConfigModule],
    controllers: [EmailController],
})
export class EmailModule {}
