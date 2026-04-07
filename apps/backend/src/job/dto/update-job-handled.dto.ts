import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean } from "class-validator";

export class UpdateJobHandledDto {
    @ApiProperty({
        description: "Handled status to set for the job.",
        type: Boolean,
    })
    @IsBoolean()
    handled!: boolean;
}
