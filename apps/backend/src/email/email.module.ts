import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Email } from "./entities/email.entity";
import { EmailController } from "./email.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Email])],
    exports: [TypeOrmModule],
    controllers: [EmailController],
})
export class EmailModule {}
