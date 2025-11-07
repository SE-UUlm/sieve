import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from "@nestjs/terminus";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Health")
@Controller("health")
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private db: TypeOrmHealthIndicator,
    ) {}

    @Get()
    @ApiOperation({ summary: "Gets the health status of the SIEVE backend service" })
    @HealthCheck()
    check() {
        return this.health.check([() => this.db.pingCheck("database")]);
    }
}
