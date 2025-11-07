import { PickType } from "@nestjs/swagger";
import { EmailDto } from "./email.dto";

export class CreateEmailDto extends PickType(EmailDto, ["sender", "subject", "body"] as const) {}
