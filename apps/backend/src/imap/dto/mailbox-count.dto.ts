import { ApiProperty } from "@nestjs/swagger";

export class MailboxCountDto {
    @ApiProperty({
        description: "Number of messages in the mailbox",
        example: 42,
    })
    count!: number;
}
