import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UserDto } from "./dto/user.dto";
import { SimpleUserDto } from "./dto/simple-user.dto";
import { UserRole } from "../../prisma/client/enums";
import { Roles } from "@thallesp/nestjs-better-auth";

// TODO: Remove eslint-disable when implementing methods
/* eslint-disable @typescript-eslint/no-unused-vars */
@ApiTags("Users")
@Controller("users")
export class UserController {
    @Get()
    @Roles([UserRole.ADMIN])
    @ApiBearerAuth()
    @ApiOperation({
        summary: "List all users (admin only)",
        description: "Only contains a simplified view of a user",
    })
    @ApiResponse({
        status: 200,
        description: "Users successfully retrieved",
        type: [SimpleUserDto],
    })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    getUsers(
        @Query("page") page?: number,
        @Query("limit") limit?: number,
        @Query("role") role?: UserRole,
    ): Promise<SimpleUserDto[]> {
        // TODO: Implement user retrieval logic
        return Promise.resolve([]);
    }

    @Get(":userId")
    @Roles([UserRole.ADMIN])
    @ApiBearerAuth()
    @ApiOperation({ summary: "Get detailed user information (admin only)" })
    @ApiResponse({ status: 200, description: "User successfully retrieved", type: UserDto })
    @ApiResponse({ status: 401, description: "Unauthorized" })
    @ApiResponse({ status: 403, description: "Forbidden" })
    @ApiResponse({ status: 404, description: "User not found" })
    getUserById(@Param("userId") userId: string): Promise<UserDto> {
        // TODO: Implement user retrieval by ID logic
        return Promise.resolve({} as UserDto);
    }
}
