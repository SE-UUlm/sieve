import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateInstanceApiKeyDto {
    @ApiProperty({
        description: "OpenAI API key for this SIEVE instance.",
        example: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    apiKey!: string;
}
