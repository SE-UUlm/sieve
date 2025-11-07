import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UserDto } from "./dto/user.dto";
import { UserRole } from "./entities/user.entity";
import { SimpleUserDto } from "./dto/simple-user.dto";

// TODO: Add an Admin-only guard at the controller level, e.g., @UseGuards(AdminGuard)
// TODO: Remove eslint-disable when implementing methods
/* eslint-disable @typescript-eslint/no-unused-vars */
@ApiTags("Users")
@Controller("users")
export class UserController {
    @Get()
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
