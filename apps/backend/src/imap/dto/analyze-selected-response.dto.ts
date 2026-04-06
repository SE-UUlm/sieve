import { ApiProperty } from "@nestjs/swagger";

export class AnalyzeSelectedResponseDto {
    @ApiProperty({
        description: "Number of emails successfully processed",
        example: 3,
    })
    processedCount!: number;

    @ApiProperty({
        description: "Whether the operation succeeded",
        example: true,
    })
    success!: boolean;
}
