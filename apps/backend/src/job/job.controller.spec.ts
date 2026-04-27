import { Test, type TestingModule } from "@nestjs/testing";
import { JobController } from "./job.controller";
import { JobService } from "./job.service";

describe("JobController", () => {
    let controller: JobController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [JobController],
            providers: [
                {
                    provide: JobService,
                    useValue: {
                        getHistory: jest.fn(),
                        getJobs: jest.fn(),
                        getJobById: jest.fn(),
                        getJobResult: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<JobController>(JobController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
