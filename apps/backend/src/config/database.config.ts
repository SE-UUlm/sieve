import Joi from "joi";
import { registerAs } from "@nestjs/config";

export const databaseValidationSchema = Joi.object({
    DB_HOST: Joi.string().default("localhost"),
    DB_PORT: Joi.number().port().default(5432),
    DB_USERNAME: Joi.string().default("postgres"),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME: Joi.string().default("postgres"),
});

export default registerAs("database", () => ({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? "5432", 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
}));
