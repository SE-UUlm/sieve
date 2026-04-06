import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SmtpService } from "./smtp.service";

@Module({
    imports: [ConfigModule],
    providers: [SmtpService],
    exports: [SmtpService],
})
export class SmtpModule {}
