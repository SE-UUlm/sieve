import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class ValidateInstanceProviderModelDto {
    @ApiProperty({
        description: "Model identifier to validate for the selected provider.",
        example: "gpt-5.2",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    model!: string;
}
