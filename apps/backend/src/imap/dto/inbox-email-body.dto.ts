import { ApiProperty } from "@nestjs/swagger";

export class InboxEmailBodyDto {
    @ApiProperty({
        description: "IMAP UID of the message",
        example: 42,
    })
    uid!: number;

    @ApiProperty({
        description: "Plain-text body of the email",
        example: "Dear customer, your order has been shipped.",
    })
    body!: string;
}
