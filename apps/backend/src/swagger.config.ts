import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";

export function setupSwagger(app: INestApplication): void {
    const config = new DocumentBuilder()
        .setTitle("SIEVE")
        .setDescription(
            "This is the OpenAPI specification for the communication to the SIEVE backend via the REST-API. The SIEVE frontend and backend communicate via this API.",
        )
        .setVersion("0.1.0")
        .setOpenAPIVersion("3.1.1")
        .setLicense("GPLv3-or-later", "https://www.gnu.org/licenses/gpl-3.0.html")
        .setExternalDoc("Documentation", "https://github.com/SE-UUlm/sieve/wiki")
        .addTag("Authentication", "Endpoints for user authentication and session management.")
        .addTag(
            "Users",
            "Endpoints for listing and inspecting users. Accessible only to users with admin roles.",
        )
        .addTag(
            "Emails",
            "Endpoints for submitting and managing uploaded emails. Each uploaded email triggers job creation and processing in the backend.",
        )
        .addTag(
            "Jobs",
            "Endpoints to list or inspect background processing jobs created by the user.",
        )
        .addTag("Health", "Endpoint to check the health status of the SIEVE backend service.")
        .addBearerAuth(
            { type: "http", description: "JWT Bearer token authentication" },
            "bearerAuth",
        )
        .build();
    const document = SwaggerModule.createDocument(app, config);

    app.use(
        "/docs",
        apiReference({
            content: document,
        }),
    );
}
