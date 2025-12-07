import { Test, TestingModule } from "@nestjs/testing";
import { LangflowService } from "./langflow.service";

describe("LangflowService", () => {
    let service: LangflowService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [LangflowService],
        }).compile();

        service = module.get<LangflowService>(LangflowService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
