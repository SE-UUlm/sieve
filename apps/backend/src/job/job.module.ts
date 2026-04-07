import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { JobController } from "./job.controller";
import { JobService } from "./job.service";

@Module({
    imports: [PrismaModule],
    controllers: [JobController],
    providers: [JobService],
    exports: [JobService],
})
export class JobModule {}
