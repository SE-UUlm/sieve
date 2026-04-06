import { ApiProperty } from "@nestjs/swagger";

export class InboxEmailDto {
    @ApiProperty({
        description: "IMAP UID of the message",
        example: 42,
    })
    uid!: number;

    @ApiProperty({
        description: "Email subject",
        example: "Order confirmation #12345",
        required: false,
    })
    subject?: string;

    @ApiProperty({
        description: "Sender email address",
        example: "sender@example.com",
        required: false,
    })
    sender?: string;

    @ApiProperty({
        description: "Date the email was sent (ISO string)",
        example: "2026-04-06T10:00:00.000Z",
        required: false,
    })
    date?: string;
}
