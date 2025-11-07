import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../entities/user.entity";
import { IsEmail, IsEnum, IsNotEmpty, IsString, IsUUID } from "class-validator";
import { EXAMPLE_USER_ID } from "../../common/examples.constants";

export class SimpleUserDto {
    // TODO: replace with actual UUID version once implemented
    @ApiProperty({ description: "Unique user ID", type: String, example: EXAMPLE_USER_ID })
    @IsUUID()
    id!: string;

    @ApiProperty({ description: "Full name of the user", type: String, example: "John Doe" })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({
        description: "Email address of the user",
        type: String,
        example: "john.doe@example.com",
    })
    @IsEmail()
    email!: string;

    @ApiProperty({ description: "Role of the user", enum: UserRole, example: UserRole.USER })
    @IsEnum(UserRole)
    role!: UserRole;
}
