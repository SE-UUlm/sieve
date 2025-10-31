import appConfig, { appValidationSchema } from "./app.config";
import databaseConfig, { databaseValidationSchema } from "./database.config";
import Joi from "joi";

export const allConfigs = [appConfig, databaseConfig];

export const combinedValidationSchema = Joi.object({
    ...appValidationSchema.describe().keys,
    ...databaseValidationSchema.describe().keys,
})
