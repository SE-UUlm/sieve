import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEnum } from "class-validator";
import { AIProvider } from "../../../prisma/client/enums";
import { ProviderSettingsDto } from "./provider-settings.dto";

export class InstanceSettingsDto {
    @ApiProperty({
        description:
            "Provider currently used for all analyses in this instance.",
        enum: AIProvider,
        example: AIProvider.OPENAI,
    })
    @IsEnum(AIProvider)
    activeProvider!: AIProvider;

    @ApiProperty({
        description: "Settings state for each supported AI provider.",
        type: [ProviderSettingsDto],
    })
    @IsArray()
    providers!: ProviderSettingsDto[];
}
