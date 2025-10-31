import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum UserRole {
    ADMIN = "admin",
    USER = "user",
}

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: number;

    @Column({
        unique: true,
    })
    email!: string;

    @Column()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.USER,
    })
    role!: UserRole;
}
