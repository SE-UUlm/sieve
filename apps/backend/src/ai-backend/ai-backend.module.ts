import { Module } from "@nestjs/common";
import { AiBackendService } from "./ai-backend.service";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [ConfigModule],
    providers: [AiBackendService],
    exports: [AiBackendService],
})
export class AiBackendModule {}
