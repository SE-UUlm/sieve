import { Test, type TestingModule } from "@nestjs/testing";
import { AiBackendService } from "../ai-backend/ai-backend.service";
import { EmailController } from "./email.controller";

describe("EmailController", () => {
    let controller: EmailController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [EmailController],
            providers: [
                {
                    provide: AiBackendService,
                    useValue: {
                        runFlow: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<EmailController>(EmailController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
