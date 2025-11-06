import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JobResult } from "./entities/job-result.entity";

@Module({
    imports: [TypeOrmModule.forFeature([JobResult])],
    exports: [TypeOrmModule],
})
export class JobResultModule {}
