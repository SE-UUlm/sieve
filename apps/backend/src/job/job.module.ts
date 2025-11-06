import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Job } from "./entities/job.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Job])],
    exports: [TypeOrmModule],
})
export class JobModule {}
