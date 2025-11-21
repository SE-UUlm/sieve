import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from "@nestjs/terminus";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: PrismaHealthIndicator,
        private prisma: PrismaService,
    ) {}

    @Get()
    @ApiOperation({ summary: "Gets the health status of the SIEVE backend service" })
    @HealthCheck()
    check() {
        return this.health.check([() => this.db.pingCheck("database", this.prisma)]);
    }
}
