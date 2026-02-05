import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AiBackendService } from "./ai-backend.service";

@Module({
  imports: [ConfigModule],
  providers: [AiBackendService],
  exports: [AiBackendService],
})
export class AiBackendModule {}
