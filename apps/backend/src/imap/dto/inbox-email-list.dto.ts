import { ApiProperty } from "@nestjs/swagger";
import { InboxEmailDto } from "./inbox-email.dto";

export class InboxEmailListDto {
    @ApiProperty({
        description: "List of emails currently in the configured inbox folder",
        type: [InboxEmailDto],
    })
    emails!: InboxEmailDto[];
}
