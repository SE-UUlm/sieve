import { ApiProperty } from "@nestjs/swagger";

export class ListFoldersRequestDto {
    @ApiProperty({
        description: "IMAP server hostname",
        example: "imap.gmail.com",
    })
    host!: string;

    @ApiProperty({
        description: "IMAP server port",
        example: 993,
    })
    port!: number;

    @ApiProperty({
        description: "Username for authentication",
        example: "user@example.com",
    })
    username!: string;

    @ApiProperty({
        description: "Password for authentication",
        example: "app-password",
    })
    password!: string;

    @ApiProperty({
        description: "Connection security type",
        enum: ["ssl", "starttls", "none"],
        example: "ssl",
    })
    security!: "ssl" | "starttls" | "none";
}
