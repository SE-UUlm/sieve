import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import Joi from "joi";
import { DatabaseModule } from "./database/database.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validationSchema: Joi.object({
                BACKEND_PORT: Joi.number().port().required(),

                DB_HOST: Joi.string().default("localhost"),
                DB_PORT: Joi.number().port().default(5432),
                DB_USERNAME: Joi.string().default("postgres"),
                DB_PASSWORD: Joi.string().required(),
                DB_NAME: Joi.string().default("postgres"),
            }),
        }),
        DatabaseModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
