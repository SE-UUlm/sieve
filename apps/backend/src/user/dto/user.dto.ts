import { ApiProperty } from "@nestjs/swagger";
import {
    IsArray,
    IsDateString,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
} from "class-validator";
import { EXAMPLE_USER_ID } from "../../common/examples.constants";
import { UserRole } from "../../../prisma/client/enums";

export class UserDto {
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

    @ApiProperty({ description: "Creation timestamp", type: String, format: "date-time" })
    @IsDateString()
    createdAt!: string;

    @ApiProperty({
        description: "Last update timestamp",
        type: String,
        format: "date-time",
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsDateString()
    updatedAt?: string | null;

    @ApiProperty({
        description: "Deletion timestamp, if soft-deleted",
        type: String,
        format: "date-time",
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsDateString()
    deletedAt?: string | null;

    @ApiProperty({
        description: "IDs of jobs created by the user",
        type: [String],
        required: false,
    })
    @IsArray()
    // TODO: replace with actual UUID version once implemented
    @IsUUID("4", { each: true })
    jobs?: string[];

    @ApiProperty({
        description: "IDs of emails uploaded by the user",
        type: [String],
        required: false,
    })
    @IsArray()
    // TODO: replace with actual UUID version once implemented
    @IsUUID("4", { each: true })
    emails?: string[];
}
