import { Test, type TestingModule } from "@nestjs/testing";
import { EmailController } from "./email.controller";
import { EmailService } from "./email.service";

describe("EmailController", () => {
    let controller: EmailController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [EmailController],
            providers: [
                {
                    provide: EmailService,
                    useValue: {
                        submitEmail: jest.fn(),
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
