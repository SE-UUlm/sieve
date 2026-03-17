import { Module } from "@nestjs/common";
import { ImapService } from "./imap.service";
import { ImapController } from "./imap.controller";
import { SettingsModule } from "../settings/settings.module";

@Module({
    imports: [SettingsModule],
    controllers: [ImapController],
    providers: [ImapService],
    exports: [ImapService],
})
export class ImapModule {}
