import Joi from "joi";
import { registerAs } from "@nestjs/config";

export const appValidationSchema = Joi.object({
    BACKEND_PORT: Joi.number().port().required(),
});

export default registerAs("app", () => ({
    port: parseInt(process.env.BACKEND_PORT ?? "3000", 10),
}));
