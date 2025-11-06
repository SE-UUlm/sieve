import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Job } from "./job.entity";
import { Email } from "./email.entity";

export enum UserRole {
    ADMIN = "admin",
    USER = "user",
}

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    name!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    passwordHash!: string;

    @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
    role!: UserRole;

    @CreateDateColumn({ type: "timestamptz" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", nullable: true })
    updatedAt?: Date;

    @DeleteDateColumn({ type: "timestamptz", nullable: true })
    deletedAt?: Date;

    @OneToMany(() => Job, (job) => job.user)
    jobs!: Job[];

    @OneToMany(() => Email, (email) => email.user)
    emails!: Email[];
}
