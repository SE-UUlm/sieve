import { Module } from "@nestjs/common";
import { LangflowService } from "./langflow.service";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [ConfigModule],
    providers: [LangflowService],
    exports: [LangflowService],
})
export class LangflowModule {}
