import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { setupSwagger } from "./swagger.config";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
    const nestApplication = await NestFactory.create(AppModule);

    const configService = nestApplication.get(ConfigService);
    const port = configService.get<number>("BACKEND_PORT");

    setupSwagger(nestApplication);

    nestApplication.useGlobalPipes(new ValidationPipe());

    await nestApplication.listen(port!);
}

bootstrap().catch((error) => {
    console.error(error);
    process.exit(1);
});
