import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { AiBackendModule } from "../ai-backend/ai-backend.module";
import { PrismaModule } from "../prisma/prisma.module";
import { HealthController } from "./health.controller";

@Module({
    imports: [TerminusModule, PrismaModule, AiBackendModule],
    controllers: [HealthController],
})
export class HealthModule {}
