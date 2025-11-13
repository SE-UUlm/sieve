import { betterAuth } from "better-auth";
import { typeormAdapter } from "@hedystia/better-auth-typeorm";
import { dataSource } from "../database/data-source";

export const auth = betterAuth({
    database: typeormAdapter(dataSource),
    emailAndPassword: {
        enabled: true,
        autoSignIn: false,
    },
});
