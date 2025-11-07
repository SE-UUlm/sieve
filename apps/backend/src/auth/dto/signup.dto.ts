import { ApiProperty } from "@nestjs/swagger";

export class SignupDto {
    @ApiProperty({ example: "John Doe" })
    name!: string;

    @ApiProperty({ example: "john.doe@example.com" })
    email!: string;

    @ApiProperty({ example: "strongPassword123!" })
    password!: string;
}
