import { Module } from "@nestjs/common";
import { SmtpModule } from "src/smtp/smtp.module";
import { AiBackendModule } from "../ai-backend/ai-backend.module";
import { EmailController } from "./email.controller";

@Module({
    imports: [AiBackendModule, SmtpModule],
    controllers: [EmailController],
})
export class EmailModule {}
