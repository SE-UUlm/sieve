import { ConfigService } from "@nestjs/config";
import { Test, type TestingModule } from "@nestjs/testing";
import { AiBackendService } from "./ai-backend.service";

describe("AiBackendService", () => {
    let service: AiBackendService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AiBackendService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue("http://localhost:8080"),
                    },
                },
            ],
        }).compile();

        service = module.get<AiBackendService>(AiBackendService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
