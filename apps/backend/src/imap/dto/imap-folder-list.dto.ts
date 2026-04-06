import { ApiProperty } from "@nestjs/swagger";

export class ImapFolderListDto {
    @ApiProperty({
        description: "List of available IMAP folder paths",
        example: ["INBOX", "Sent", "Drafts", "Trash"],
        type: [String],
    })
    folders!: string[];
}
