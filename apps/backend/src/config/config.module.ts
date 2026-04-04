import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import Joi from "joi";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            // Disable validation if we generate the OpenAPI spec, so we do not need a .env file for that
            validationSchema:
                process.env.GENERATE_OPENAPI === "true"
                    ? null
                    : Joi.object({
                          BACKEND_PORT: Joi.number().port().required(),

                          DB_HOST: Joi.string().required(),
                          DB_PORT: Joi.number().port().required(),
                          DB_USERNAME: Joi.string().required(),
                          DB_PASSWORD: Joi.string().required(),
                          DB_NAME: Joi.string().required(),

                          AI_BACKEND_URL: Joi.string().required(),
                          SETTINGS_ENCRYPTION_KEY: Joi.string().required(),

                          SMTP_HOST: Joi.string().allow(""),
                          SMTP_PORT: Joi.number().port().allow(""),
                          SMTP_USER: Joi.string().allow(""),
                          SMTP_PASS: Joi.string().allow(""),
                          SMTP_FROM: Joi.string().allow(""),

                          AUTO_SEND_RESPOND_THRESHOLD: Joi.number()
                              .required()
                              .min(0)
                              .max(100)
                              .allow(-1),
                      }),
        }),
    ],
})
export class AppConfigModule {}
