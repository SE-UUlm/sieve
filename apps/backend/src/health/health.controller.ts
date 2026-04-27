import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
    HealthCheck,
    HealthCheckService,
    PrismaHealthIndicator,
} from "@nestjs/terminus";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { AiBackendHealthIndicator } from "../ai-backend/ai-backend.health";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: PrismaHealthIndicator,
        private prisma: PrismaService,
        private aiBackendHealthIndicator: AiBackendHealthIndicator,
    ) {}

    @Get()
    @AllowAnonymous()
    @ApiOperation({
        summary: "Gets the health status of the SIEVE backend service",
    })
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.db.pingCheck("database", this.prisma),
            () => this.aiBackendHealthIndicator.isHealthy("ai-backend"),
        ]);
    }
}
