import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class SendEmailResponseDto {
    @ApiProperty({
        description: "Recieptient of the email (customer email address)",
        type: String,
        example: "alice.smith@example.com",
    })
    @IsEmail()
    receiptient!: string;

    @ApiProperty({
        description: "Subject of the email",
        type: String,
        example: "Piece Availability Request",
    })
    @IsString()
    @IsNotEmpty()
    subject!: string;

    @ApiProperty({
        description: "Body of the email",
        type: String,
        example:
            "Dear Customer,\n\n" +
            "Thank your for your inquiry about the 23 beach villas! I recommend the “Creator Beach Villa 3-in-1” set, which includes 1,021 pieces and is available for €94.99.\n\n" +
            "Best regards,\n" +
            "Sieve Support Agent",
    })
    @IsString()
    @IsNotEmpty()
    body!: string;
}
