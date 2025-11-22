import { setupServer } from "msw/node";
import { getJobsMock } from "@/lib/client/jobs/jobs.msw";
import { getUsersMock } from "@/lib/client/users/users.msw";
import { getEmailsMock } from "@/lib/client/emails/emails.msw";
import { getHealthMock } from "@/lib/client/health/health.msw";
import { getDefaultMock } from "./lib/client/default/default.msw";

export async function register() {
    // NEXT_RUNTIME check is necessary because otherwise next.js tries to compile the code in the edge runtime and that fails because msw does not work there
    if (process.env.NEXT_RUNTIME === "nodejs" && process.env.ENABLE_MOCK === "true") {
        const server = setupServer();
        const mockHandler = [
            ...getDefaultMock(),
            ...getJobsMock(),
            ...getUsersMock(),
            ...getEmailsMock(),
            ...getHealthMock(),
        ];
        server.use(...mockHandler);
        server.listen();
    }
}
