import { Module } from "@nestjs/common";
import { EmailController } from "./email.controller";
import { AiBackendModule } from "../ai-backend/ai-backend.module";

@Module({
  imports: [AiBackendModule],
  controllers: [EmailController],
})
export class EmailModule {}
