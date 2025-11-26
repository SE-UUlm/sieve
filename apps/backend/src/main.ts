import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { setupSwagger } from "./swagger.config";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bodyParser: false, // Disable built-in body parser, nestjs-better-auth re-adds it
    });

    const configService = app.get(ConfigService);
    const port = configService.get<number>("BACKEND_PORT");

    setupSwagger(app);

    app.useGlobalPipes(new ValidationPipe());

    await app.listen(port!);
}

bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
