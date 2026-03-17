import { ApiProperty } from "@nestjs/swagger";

export class ImapStatusDto {
    @ApiProperty({
        description: "Whether the IMAP connection is successfully established",
        example: true,
    })
    isConnected!: boolean;

    @ApiProperty({
        description: "Error message if connection failed",
        example: "Authentication failed",
        required: false,
    })
    lastError?: string;

    @ApiProperty({
        description: "Last successful sync timestamp",
        example: "2026-03-17T10:00:00.000Z",
        required: false,
    })
    lastSyncedAt?: string;

    @ApiProperty({
        description: "Number of messages in the mailbox",
        example: 42,
        required: false,
    })
    messageCount?: number;

    @ApiProperty({
        description: "Whether IMAP integration is enabled",
        example: true,
    })
    isEnabled!: boolean;
}
