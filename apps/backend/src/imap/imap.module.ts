import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ImapService } from "./imap.service";
import { ImapController } from "./imap.controller";
import { ImapPollerService } from "./imap-poller.service";
import { SettingsModule } from "../settings/settings.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AiBackendModule } from "../ai-backend/ai-backend.module";

@Module({
    imports: [
        SettingsModule,
        PrismaModule,
        AiBackendModule,
        ScheduleModule.forRoot(),
        EventEmitterModule.forRoot(),
    ],
    controllers: [ImapController],
    providers: [ImapService, ImapPollerService],
    exports: [ImapService, ImapPollerService],
})
export class ImapModule {}
