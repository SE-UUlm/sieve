import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsString } from "class-validator";
import { AIProvider } from "../../../prisma/client/enums";

export class ProviderSettingsDto {
    @ApiProperty({
        description: "Machine-readable provider identifier.",
        enum: AIProvider,
        example: AIProvider.OPENAI,
    })
    @IsEnum(AIProvider)
    provider!: AIProvider;

    @ApiProperty({
        description: "Display label for the provider.",
        example: "OpenAI",
    })
    @IsString()
    displayName!: string;

    @ApiProperty({
        description:
            "Whether an API key is currently configured for this provider.",
        example: true,
    })
    @IsBoolean()
    isConfigured!: boolean;

    @ApiProperty({
        description: "Whether this provider is enabled for usage.",
        example: true,
    })
    @IsBoolean()
    isEnabled!: boolean;
}
