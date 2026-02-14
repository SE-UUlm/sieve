import { ApiProperty } from "@nestjs/swagger";

export class InstanceSettingsDto {
    @ApiProperty({
        description:
            "Whether an OpenAI API key is currently configured for this instance.",
        example: true,
    })
    hasOpenAIApiKey!: boolean;

    @ApiProperty({
        description:
            "Whether OpenAI API key usage is enabled for this instance.",
        example: true,
    })
    isOpenAIApiKeyEnabled!: boolean;
}
