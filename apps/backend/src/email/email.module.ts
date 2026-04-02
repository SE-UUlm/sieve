import { Module } from "@nestjs/common";
import { AiBackendModule } from "../ai-backend/ai-backend.module";
import { EmailController } from "./email.controller";
import { SmtpModule } from "src/smtp/smtp.module";

@Module({
    imports: [AiBackendModule, SmtpModule],
    controllers: [EmailController],
})
export class EmailModule {}
