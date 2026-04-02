import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TerminusModule } from "@nestjs/terminus";
import { SmtpModule } from "src/smtp/smtp.module";
import { SettingsModule } from "../settings/settings.module";
import { AiBackendHealthIndicator } from "./ai-backend.health";
import { AiBackendService } from "./ai-backend.service";

@Module({
    imports: [ConfigModule, SettingsModule, TerminusModule, SmtpModule],
    providers: [AiBackendService, AiBackendHealthIndicator],
    exports: [AiBackendService, AiBackendHealthIndicator],
})
export class AiBackendModule {}
