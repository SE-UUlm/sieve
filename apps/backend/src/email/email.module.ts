import { Module } from "@nestjs/common";
import { EmailController } from "./email.controller";
import { LangflowModule } from "../langflow/langflow.module";

@Module({
    imports: [LangflowModule],
    controllers: [EmailController],
})
export class EmailModule {}
