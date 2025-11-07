import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
    @ApiProperty({ example: "john.doe@example.com" })
    email!: string;

    @ApiProperty({ example: "strongPassword123!" })
    password!: string;
}
