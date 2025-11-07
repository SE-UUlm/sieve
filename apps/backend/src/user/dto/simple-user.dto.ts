import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../entities/user.entity";
import { randomUUID } from "node:crypto";

export class SimpleUserDto {
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
}
