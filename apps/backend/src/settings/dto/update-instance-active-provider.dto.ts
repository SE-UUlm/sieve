import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { AIProvider } from "../../../prisma/client/enums";

export class UpdateInstanceActiveProviderDto {
    @ApiProperty({
        description: "Provider that should be used globally for analysis.",
        enum: AIProvider,
        example: AIProvider.OPENAI,
    })
    @IsEnum(AIProvider)
    provider!: AIProvider;
}
