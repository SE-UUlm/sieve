import { Module } from "@nestjs/common";
import { AiBackendModule } from "../ai-backend/ai-backend.module";
import { EmailController } from "./email.controller";

@Module({
  imports: [AiBackendModule],
  controllers: [EmailController],
})
export class EmailModule {}
