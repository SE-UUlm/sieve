import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class UpdateInstanceApiKeyEnabledDto {
    @ApiProperty({
        description:
            "Controls whether the configured provider API key may be used for analysis.",
        example: false,
    })
    @IsBoolean()
    enabled!: boolean;
}
