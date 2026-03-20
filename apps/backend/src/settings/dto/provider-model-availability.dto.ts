import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class ProviderModelAvailabilityDto {
    @ApiProperty({
        description:
            "Whether the requested model is available for the selected provider.",
        example: true,
    })
    @IsBoolean()
    isAvailable!: boolean;
}
