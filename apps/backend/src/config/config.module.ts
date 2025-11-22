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
                      }),
        }),
    ],
})
export class AppConfigModule {}
