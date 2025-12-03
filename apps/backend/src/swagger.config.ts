import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import { auth } from "./lib/auth";

export async function setupSwagger(app: INestApplication): Promise<void> {
    const config = new DocumentBuilder()
        .setTitle("SIEVE")
        .setDescription(
            `
This is the OpenAPI specification for the communication to the SIEVE backend via the REST-API. The SIEVE frontend and backend communicate via this API.

**Note**: Better Auth currently does not support customizing the tag names.
Therefore, the 'Default' tag is used for endpoints that are related to user authentication and session management.
`.trim(),
        )
        .setVersion("0.1.0")
        .setOpenAPIVersion("3.1.1")
        .setLicense("GPLv3-or-later", "https://www.gnu.org/licenses/gpl-3.0.html")
        .setExternalDoc("Documentation", "https://github.com/SE-UUlm/sieve/wiki")
        // TODO: Replace with 'Authentication' once better-auth supports customizing tag names
        //       Description is currently overwritten by the Better Auth plugin
        .addTag("Default", "Endpoints for user authentication and session management.")
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
        .build();

    const nestDocument = SwaggerModule.createDocument(app, config);
    const betterAuthSchema = (await auth.api.generateOpenAPISchema()) as OpenAPIObject;

    const finalDocument = mergeOpenApiDocs(nestDocument, betterAuthSchema);

    app.use(
        "/docs",
        apiReference({
            content: finalDocument,
            pageTitle: "SIEVE API Reference",
        }),
    );
}

/**
 * Merges two OpenAPI documents.
 *
 * @param primary The `primary` document takes precedence: conflicts are resolved in favor of `primary`.
 * @param secondary The `secondary` document appends missing paths, components, and tags.
 */
export function mergeOpenApiDocs(primary: OpenAPIObject, secondary: OpenAPIObject): OpenAPIObject {
    const out: OpenAPIObject = { ...primary };

    // Paths
    if (secondary.paths) {
        out.paths = { ...secondary.paths, ...out.paths };

        // Handle conflicts
        for (const pathKey of Object.keys(out.paths)) {
            const primaryPathItem = primary.paths?.[pathKey];
            const secondaryPathItem = secondary.paths?.[pathKey];

            if (primaryPathItem && secondaryPathItem) {
                out.paths[pathKey] = {
                    ...secondaryPathItem, // Add methods from Better Auth
                    ...primaryPathItem, // Overwrite with methods from NestJS
                };
            }
        }
    }

    // Components (Schemas, SecuritySchemes, Parameters, etc.)
    if (secondary.components) {
        out.components = { ...out.components };

        // Iterate over keys (schemas, securitySchemes, headers, etc.)
        const componentKeys = Object.keys(secondary.components) as Array<
            keyof typeof secondary.components
        >;

        for (const key of componentKeys) {
            const primaryComp = out.components[key] || {};
            const secondaryComp = secondary.components[key] || {};

            // @ts-expect-error: TypeScript struggles with the generic union of component types here,
            // but the spread logic is valid for all component sub-objects.
            out.components[key] = {
                ...secondaryComp,
                ...primaryComp,
            };
        }
    }

    // Security
    if (secondary.security) {
        const primarySecurity = out.security || [];

        const existingKeys = new Set(primarySecurity.flatMap((s) => Object.keys(s)));
        const uniqueSecondarySecurity = secondary.security.filter((sec) => {
            return !Object.keys(sec).some((key) => existingKeys.has(key));
        });

        out.security = [...primarySecurity, ...uniqueSecondarySecurity];
    }

    // Tags
    if (secondary.tags) {
        const tagMap = new Map<string, (typeof secondary.tags)[number]>();

        secondary.tags.forEach((tag) => tagMap.set(tag.name, tag));
        primary.tags?.forEach((tag) => tagMap.set(tag.name, tag));
        out.tags = Array.from(tagMap.values());
    }

    return out;
}
