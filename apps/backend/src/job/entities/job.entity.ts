import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../../user/entities/user.entity";
import { Email } from "../../email/entities/email.entity";
import { JobResult } from "../../job-result/entities/job-result.entity";

export enum JobStatus {
    CREATED = "created",
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
}

@Entity("jobs")
export class Job {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "enum", enum: JobStatus, default: JobStatus.CREATED })
    status!: JobStatus;

    @ManyToOne(() => User, (user) => user.jobs)
    user!: User;

    @OneToOne(() => Email, (email) => email.job)
    @JoinColumn()
    email!: Email;

    @Column({ type: "timestamptz", nullable: true })
    startedAt?: Date;

    @Column({ type: "timestamptz", nullable: true })
    completedAt?: Date;

    @CreateDateColumn({ type: "timestamptz" })
    createdAt!: Date;

    @DeleteDateColumn({ type: "timestamptz", nullable: true })
    deletedAt?: Date;

    @OneToOne(() => JobResult, (result) => result.job, { nullable: true })
    result!: JobResult;
}
