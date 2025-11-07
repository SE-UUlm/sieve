import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Job } from "./entities/job.entity";
import { JobController } from "./job.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Job])],
    exports: [TypeOrmModule],
    controllers: [JobController],
})
export class JobModule {}
