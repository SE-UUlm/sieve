import { ApiProperty } from "@nestjs/swagger";

export class ProcessEmailsResponseDto {
    @ApiProperty({
        description: "Number of emails processed",
        example: 10,
    })
    processedCount!: number;

    @ApiProperty({
        description: "Whether the operation was successful",
        example: true,
    })
    success!: boolean;
}
