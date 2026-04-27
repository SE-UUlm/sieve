import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateInstanceApiKeyDto {
    @ApiProperty({
        description:
            "API key for the selected provider in this SIEVE instance.",
        example: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    apiKey!: string;
}
