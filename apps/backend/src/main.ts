import { RequestMethod, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { setupSwagger } from "./swagger.config";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bodyParser: false, // Disable built-in body parser, nestjs-better-auth re-adds it
    });

    app.setGlobalPrefix("api", {
        exclude: [{ path: "docs", method: RequestMethod.GET }],
    });

    const configService = app.get(ConfigService);
    // biome-ignore lint/style/noNonNullAssertion: config is validated on startup
    const port = configService.get<number>("BACKEND_PORT")!;

    await setupSwagger(app);

    app.useGlobalPipes(new ValidationPipe());

    await app.listen(port);
}

bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
