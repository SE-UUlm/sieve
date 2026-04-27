import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { HealthIndicatorService } from "@nestjs/terminus";
import { AiBackendService } from "./ai-backend.service";

@Injectable()
export class AiBackendHealthIndicator {
    constructor(
        @Inject(HealthIndicatorService)
        private readonly healthIndicatorService: HealthIndicatorService,
        @Inject(forwardRef(() => AiBackendService))
        private readonly aiBackendService: AiBackendService,
    ) {}

    /**
     * Checks the health of the AI backend service.
     *
     * @param key The health indicator key.
     * @returns The health status.
     */
    async isHealthy(key: string) {
        const indicator = this.healthIndicatorService.check(key);
        const isHealthy = await this.aiBackendService.ping();

        if (!isHealthy) {
            return indicator.down();
        }

        return indicator.up();
    }
}
