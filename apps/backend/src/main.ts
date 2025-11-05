import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { setupSwagger } from "./swagger.config";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    const port = configService.get<number>("BACKEND_PORT");

    setupSwagger(app);

    await app.listen(port!);
}

bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
