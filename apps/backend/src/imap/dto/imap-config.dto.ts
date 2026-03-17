import { ApiProperty } from "@nestjs/swagger";

export class ImapConfigDto {
    @ApiProperty({
        description: "IMAP server hostname",
        example: "imap.gmail.com",
    })
    host!: string;

    @ApiProperty({
        description: "IMAP server port",
        example: 993,
    })
    port!: number;

    @ApiProperty({
        description: "Username for authentication",
        example: "user@example.com",
    })
    username!: string;

    @ApiProperty({
        description: "Connection security type",
        enum: ["ssl", "starttls", "none"],
        example: "ssl",
    })
    security!: "ssl" | "starttls" | "none";

    @ApiProperty({
        description: "Mailbox to connect to",
        example: "INBOX",
    })
    mailbox!: string;

    @ApiProperty({
        description: "Whether IMAP integration is enabled",
        example: true,
    })
    enabled!: boolean;
}
