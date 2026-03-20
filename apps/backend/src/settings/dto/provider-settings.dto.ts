import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
    IsBoolean,
    IsEnum,
    IsOptional,
    IsString,
    MaxLength,
} from "class-validator";
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

    @ApiPropertyOptional({
        description:
            "Configured model used for simple analysis steps for this provider.",
        type: String,
        example: "gpt-5.2-mini",
        nullable: true,
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    simpleModel!: string | null;

    @ApiPropertyOptional({
        description:
            "Configured model used for complex analysis steps for this provider.",
        type: String,
        example: "gpt-5.2",
        nullable: true,
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    complexModel!: string | null;
}
