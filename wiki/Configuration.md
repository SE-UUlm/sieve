# Configuration

This page summarizes environment variables for local development and Docker Compose.

## Where to configure variables

- Docker Compose setup: root `.env` (copy from `.env.example`)
- Backend from source: `apps/backend/.env` (copy from `apps/backend/.env.example`)
- AI-backend from source: `apps/ai-backend/.env` (copy from `apps/ai-backend/.env.example`)
- Frontend from source: optional shell variables when needed (for example `NEXT_PUBLIC_API_URL`, `ENABLE_MOCK`)

## Root `.env` (Docker Compose)

| Variable                      |  Required   | Default                 | Description                                                                                      |
|-------------------------------|:-----------:|-------------------------|--------------------------------------------------------------------------------------------------|
| `BACKEND_PORT`                |     yes     | `5175`                  | Backend service port.                                                                            |
| `FRONTEND_PORT`               |     no      | `3000`                  | Host port mapped to frontend container port `3000`.                                              |
| `DB_USERNAME`                 |     yes     | -                       | Main postgres username for backend.                                                              |
| `DB_PASSWORD`                 |     yes     | -                       | Main postgres password for backend.                                                              |
| `DB_HOST`                     |     no      | `localhost`             | Main postgres host for local host tooling/source runs (compose backend uses internal host `db`). |
| `DB_PORT`                     |     no      | `5432`                  | Main postgres port for local host tooling/source runs (compose backend uses `5432`).             |
| `DB_NAME`                     |     yes     | -                       | Main postgres database name for backend.                                                         |
| `PRODUCT_DB_USERNAME`         |     no      | `ai-backend`            | Product flow database username for AI-backend.                                                   |
| `PRODUCT_DB_PASSWORD`         |     no      | `ai-backend_password`   | Product flow database password for AI-backend.                                                   |
| `PRODUCT_DB_HOST`             |     no      | `localhost`             | Product flow database host for local host tooling.                                               |
| `PRODUCT_DB_PORT`             |     no      | `5432`                  | Product flow database port.                                                                      |
| `PRODUCT_DB_NAME`             |     no      | `ai-backend`            | Product flow database name.                                                                      |
| `RESTART_POLICY`              |     no      | `no`                    | Docker restart policy for db container.                                                          |
| `BETTER_AUTH_SECRET`          |     yes     | -                       | Better Auth secret.                                                                              |
| `BETTER_AUTH_URL`             |     yes     | `http://localhost:5175` | Backend base URL for Better Auth.                                                                |
| `AI_BACKEND_URL`              |     yes     | `http://localhost:8000` | AI-backend base URL used by backend.                                                             |
| `SETTINGS_ENCRYPTION_KEY`     |     yes     | -                       | Base64 value that decodes to 32 bytes. Used to encrypt provider API keys in backend settings.    |
| `TRUSTED_ORIGINS`             |     no      | `http://localhost:3000` | Comma-separated origins allowed by auth.                                                         |
| `FRONTEND_URL`                |     no      | `http://localhost:3000` | Frontend origin used by backend notification WebSocket CORS (`/notifications`).                  |
| `SEED_DEMO_USERS`             |     no      | `false`                 | Enables seeding of the configured admin and default non-admin user.                              |
| `SEED_ADMIN_NAME`             |     no      | `Admin`                 | Seeded admin display name.                                                                       |
| `SEED_ADMIN_EMAIL`            |     no      | `admin@example.com`     | Seeded admin email.                                                                              |
| `SEED_ADMIN_PASSWORD`         | conditional | -                       | Required on runs where `SEED_DEMO_USERS=true` and the admin user does not exist yet.             |
| `SEED_USER_NAME`              |     no      | `Alice Smith`           | Seeded default non-admin display name.                                                           |
| `SEED_USER_EMAIL`             |     no      | `alice@example.com`     | Seeded default non-admin email.                                                                  |
| `SEED_USER_PASSWORD`          | conditional | -                       | Required on runs where `SEED_DEMO_USERS=true` and the default non-admin user does not exist yet. |
| `SMTP_HOST`                   |     no      | -                       | SMTP host for email sending.                                                                     |
| `SMTP_PORT`                   |     no      | `465`                   | SMTP port for email sending.                                                                     |
| `SMTP_USER`                   |     no      | -                       | SMTP username for email sending.                                                                 |
| `SMTP_PASS`                   |     no      | -                       | SMTP password for email sending.                                                                 |
| `SMTP_FROM`                   |     no      | -                       | Sender address used for outgoing emails.                                                         |
| `AUTO_SEND_RESPOND_THRESHOLD` |     yes     | `80`                    | Confidence threshold (0-100) to auto-send generated responses; set `-1` to disable auto-send.    |

## Backend (`apps/backend`) variables

Same variable names as above are used for source runs of the backend.

Minimum required set:

- `BACKEND_PORT`
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `AI_BACKEND_URL`
- `SETTINGS_ENCRYPTION_KEY`
- `AUTO_SEND_RESPOND_THRESHOLD` (0-100, set `-1` to disable auto-send)

Optional email-delivery settings:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

Optional notification setting:

- `FRONTEND_URL` sets the allowed browser origin for backend notification WebSocket connections.

Optional seed-data settings:

- `SEED_DEMO_USERS=true` enables seeding of both configured users: admin (`SEED_ADMIN_*`) and default non-admin (`SEED_USER_*`).
- `pnpm exec prisma db seed` runs the seeding logic.
- Password env vars are only required if the corresponding user is created during that run.

`BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are also required for auth flows and should be set in normal development.

## IMAP configuration note

IMAP connection settings (`host`, `port`, `username`, `password`, `security`, `mailbox`,
auto-process toggle) are configured in the app via `Settings -> Mail` and stored in backend
`InstanceSettings` (password encrypted with `SETTINGS_ENCRYPTION_KEY`), not in environment
variables.

## Frontend (`apps/frontend`) variables

| Variable              | Required | Default                 | Description                                                                         |
|-----------------------|:--------:|-------------------------|-------------------------------------------------------------------------------------|
| `NEXT_PUBLIC_API_URL` |    no    | `http://localhost:5175` | Backend target used for `/api/:path*` rewrite. Value is resolved in dev/build time. |
| `ENABLE_MOCK`         |    no    | `false`                 | Enables MSW-based API mocking when set to `true` in local dev.                      |

## AI-backend (`apps/ai-backend`) variables

AI-backend can run without product DB configuration for non-product flows. Product flow requires all values below:

| Variable              |  Required   | Default | Description               |
|-----------------------|:-----------:|---------|---------------------------|
| `PRODUCT_DB_USERNAME` | conditional | -       | Product flow DB username. |
| `PRODUCT_DB_PASSWORD` | conditional | -       | Product flow DB password. |
| `PRODUCT_DB_HOST`     | conditional | -       | Product flow DB host.     |
| `PRODUCT_DB_PORT`     | conditional | -       | Product flow DB port.     |
| `PRODUCT_DB_NAME`     | conditional | -       | Product flow DB name.     |
