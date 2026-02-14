import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SettingsModule } from "../settings/settings.module";
import { AiBackendService } from "./ai-backend.service";

@Module({
    imports: [ConfigModule, SettingsModule],
    providers: [AiBackendService],
    exports: [AiBackendService],
})
export class AiBackendModule {}
