import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateInstanceProviderModelsDto {
    @ApiProperty({
        description:
            "Model identifier used for simple analysis steps for the selected provider.",
        example: "gpt-5.2-mini",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    simpleModel!: string;

    @ApiProperty({
        description:
            "Model identifier used for complex analysis steps for the selected provider.",
        example: "gpt-5.2",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    complexModel!: string;
}
