import { Module } from "@nestjs/common";
import { AiBackendModule } from "../ai-backend/ai-backend.module";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailController } from "./email.controller";
import { EmailService } from "./email.service";

@Module({
    imports: [AiBackendModule, PrismaModule],
    controllers: [EmailController],
    providers: [EmailService],
})
export class EmailModule {}
