import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { EXAMPLE_USER_ID } from "../../common/examples.constants";

export class EmailDto {
    // TODO: replace with actual UUID version once implemented
    @ApiProperty({ description: "Unique email ID", type: String, example: EXAMPLE_USER_ID })
    @IsUUID()
    id!: string;

    // TODO: replace with actual UUID version once implemented
    @ApiProperty({ description: "User ID of the owner", type: String, example: EXAMPLE_USER_ID })
    @IsUUID()
    userId!: string;

    @ApiProperty({
        description: "Sender of the email",
        type: String,
        example: "alice.smith@example.com",
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsEmail()
    sender?: string | null;

    @ApiProperty({
        description: "Subject of the email",
        type: String,
        example: "Piece Availability Request",
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsString()
    subject?: string | null;

    @ApiProperty({
        description: "Body of the email",
        type: String,
        example:
            "Dear Sir or Madam,\n\n" +
            "I would like to request information regarding the availability of the following pieces...\n\n" +
            "Best regards,\n" +
            "Alice Smith",
    })
    @IsString()
    @IsNotEmpty()
    body!: string;

    @ApiProperty({ description: "Creation timestamp", type: String, format: "date-time" })
    @IsDateString()
    createdAt!: string;

    @ApiProperty({
        description: "Deletion timestamp if soft-deleted",
        type: String,
        format: "date-time",
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsDateString()
    deletedAt?: string | null;

    // TODO: replace with actual UUID version once implemented
    @ApiProperty({ description: "Associated job ID", type: String, example: EXAMPLE_USER_ID })
    @IsUUID()
    jobId!: string;
}
