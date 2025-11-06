import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Job } from "../../job/entities/job.entity";

export enum JobResultStatus {
    SUCCESS = "success",
    FAILURE = "failure",
}

@Entity()
export class JobResult {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @OneToOne(() => Job, (job) => job.result)
    @JoinColumn()
    job!: Job;

    @Column({ type: "enum", enum: JobResultStatus })
    status!: JobResultStatus;

    @Column({ type: "json" })
    output!: any;

    @CreateDateColumn({ type: "timestamptz" })
    createdAt!: Date;

    @DeleteDateColumn({ type: "timestamptz", nullable: true })
    deletedAt?: Date;
}
