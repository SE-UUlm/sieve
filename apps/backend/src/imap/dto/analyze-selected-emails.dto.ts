import { ApiProperty } from "@nestjs/swagger";

export class AnalyzeSelectedEmailsDto {
    @ApiProperty({
        description: "IMAP UIDs of the emails to analyze",
        example: [42, 43, 44],
        type: [Number],
    })
    uids!: number[];
}
