import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../../user/entities/user.entity";
import { Job } from "../../job/entities/job.entity";

@Entity("emails")
export class Email {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => User, (user) => user.emails)
    user!: User;

    @Column({ nullable: true })
    sender?: string;

    @Column({ nullable: true })
    subject?: string;

    @Column("text")
    body!: string;

    @CreateDateColumn({ type: "timestamptz" })
    createdAt!: Date;

    @DeleteDateColumn({ type: "timestamptz", nullable: true })
    deletedAt?: Date;

    @OneToOne(() => Job, (job) => job.email)
    job!: Job;
}
