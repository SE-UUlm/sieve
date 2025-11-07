import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateEmailDto {
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
}
