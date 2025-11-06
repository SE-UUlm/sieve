import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../entities/user.entity";
import { randomUUID } from "node:crypto";

export class UserDto {
    // TODO: replace with actual UUID version once implemented
    @ApiProperty({ description: "Unique user ID", type: String, example: randomUUID() })
    id!: string;

    @ApiProperty({ description: "Full name of the user", type: String, example: "John Doe" })
    name!: string;

    @ApiProperty({
        description: "Email address of the user",
        type: String,
        example: "john.doe@example.com",
    })
    email!: string;

    @ApiProperty({ description: "Role of the user", enum: UserRole, example: UserRole.USER })
    role!: UserRole;

    @ApiProperty({ description: "Creation timestamp", type: String, format: "date-time" })
    createdAt!: string;

    @ApiProperty({
        description: "Last update timestamp",
        type: String,
        format: "date-time",
        required: false,
        nullable: true,
    })
    updatedAt?: string | null;

    @ApiProperty({
        description: "Deletion timestamp, if soft-deleted",
        type: String,
        format: "date-time",
        required: false,
        nullable: true,
    })
    deletedAt?: string | null;

    @ApiProperty({
        description: "IDs of jobs created by the user",
        type: [String],
        required: false,
    })
    jobs?: string[];

    @ApiProperty({
        description: "IDs of emails uploaded by the user",
        type: [String],
        required: false,
    })
    emails?: string[];
}
