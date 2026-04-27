import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { AiBackendModule } from "../ai-backend/ai-backend.module";
import { PrismaModule } from "../prisma/prisma.module";
import { SettingsModule } from "../settings/settings.module";
import { SmtpModule } from "../smtp/smtp.module";
import { ImapController } from "./imap.controller";
import { ImapService } from "./imap.service";
import { ImapPollerService } from "./imap-poller.service";

@Module({
    imports: [
        SettingsModule,
        PrismaModule,
        AiBackendModule,
        SmtpModule,
        ScheduleModule.forRoot(),
        EventEmitterModule.forRoot(),
    ],
    controllers: [ImapController],
    providers: [ImapService, ImapPollerService],
    exports: [ImapService, ImapPollerService],
})
export class ImapModule {}
