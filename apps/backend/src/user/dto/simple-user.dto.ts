import { PickType } from "@nestjs/swagger";
import { UserDto } from "./user.dto";

export class SimpleUserDto extends PickType(UserDto, ["id", "name", "email", "role"] as const) {}
