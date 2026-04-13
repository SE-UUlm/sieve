# Getting Started

This page describes how to run SIEVE locally with Docker Compose (recommended) or from source.

## Prerequisites

- [Docker](https://www.docker.com/get-started/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) (for source builds of frontend/backend)
- [pnpm](https://pnpm.io/installation) (for source builds of frontend/backend)
- [Python 3.10+](https://www.python.org/) and [uv](https://docs.astral.sh/uv/getting-started/installation/) (for source builds of ai-backend)

## Docker Compose (recommended)

1. Clone and enter the repository.

   ```bash
   git clone git@github.com:SE-UUlm/sieve.git
   cd sieve
   ```

2. Create local environment configuration.

   ```bash
   cp .env.example .env
   ```

3. Generate the backend encryption key and set it in `.env` as `SETTINGS_ENCRYPTION_KEY`.

   ```bash
   openssl rand -base64 32
   ```

4. Start all services.

   ```bash
   docker compose up
   ```

5. Open the application.
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5175/api`
   - Backend docs: `http://localhost:5175/docs`
   - AI-Backend docs: `http://localhost:8000/docs`

### Compose profiles

You can run subsets of the stack with profiles:

- Database only: `docker compose --profile db-only up`
- Backend only: `docker compose --profile backend-only up`
- Backend + db: `docker compose --profile backend-only --profile db-only up`
- Frontend only: `docker compose --profile frontend-only up`
- AI-Backend only: `docker compose --profile ai-backend-only up`

### Local image builds with Compose

When using `docker compose up --build`, generate frontend API clients first:

```bash
cd apps/backend
pnpm install
pnpm run generate:clients
```

## Run from source

### Backend (`apps/backend`)

1. Install dependencies and configure environment variables.

   ```bash
   cd apps/backend
   pnpm install
   cp .env.example .env
   ```

2. Set a valid base64-encoded 32-byte `SETTINGS_ENCRYPTION_KEY` in `apps/backend/.env`.

   ```bash
   openssl rand -base64 32
   ```

3. Generate Prisma client and apply schema to your database.

   ```bash
   pnpm run generate:client:prisma
   pnpm exec prisma db push
   ```

4. Optional: bootstrap default users:
   - set `SEED_DEMO_USERS=true`
   - admin: `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (password needed when admin does not exist yet)
   - non-admin (Alice by default): `SEED_USER_NAME`, `SEED_USER_EMAIL`, `SEED_USER_PASSWORD` (password needed when user does not exist yet)
   - run:

   ```bash
   pnpm exec prisma db seed
   ```

5. Start backend in development mode.

   ```bash
   pnpm run dev
   ```

### Frontend (`apps/frontend`)

1. Install dependencies.

   ```bash
   cd apps/frontend
   pnpm install
   ```

2. Generate API clients from backend OpenAPI.

   ```bash
   cd ../backend
   pnpm run generate:clients
   cd ../frontend
   ```

3. Start development server.

   ```bash
   pnpm run dev
   ```

The frontend proxies `/api/*` to the backend (default target `http://localhost:5175`).

To run with API mocks:

```bash
ENABLE_MOCK=true pnpm run dev
```

### AI-Backend (`apps/ai-backend`)

1. Install dependencies and optionally create local env config.

   ```bash
   cd apps/ai-backend
   uv sync
   cp .env.example .env
   ```

2. Start in development mode.

   ```bash
   uv run dev
   ```

3. Optional quality commands:

   ```bash
   uv run test
   uv run lint
   uv run typecheck
   uv run format
   uv run evaluate
   ```

### Product database setup for AI product flow

The product flow requires product DB variables (`PRODUCT_DB_*`). If `PRODUCT_DB_NAME` is unset, product flow is not available.

To load the provided sample dataset:

1. Ensure postgres is running.
2. Edit `apps/ai-backend/prepare_db.sql`:
   - replace `xxxxxx` with your `PRODUCT_DB_PASSWORD`
   - if needed, replace all `"ai-backend"` identifiers with your configured `PRODUCT_DB_USERNAME` / `PRODUCT_DB_NAME`
3. Execute the SQL file, for example:

   ```bash
   psql -h localhost -U <postgres-username> -f apps/ai-backend/prepare_db.sql
   ```

   or through the compose db container:

   ```bash
   cat apps/ai-backend/prepare_db.sql | docker compose exec -T db psql -U <postgres-username>
   ```

## First in-app configuration

After first login as admin:

1. Go to `Settings -> Provider` and configure provider API keys and model identifiers.
2. Go to `Settings -> Category` to configure analysis categories.
3. (Optional) Go to `Settings -> Mail` to connect an IMAP mailbox, then use the `IMAP` view to select inbox emails for analysis.

For a practical quick-start and full technical reference for category configuration
(including required schema keys and examples), see
[Category Settings Guide](https://github.com/SE-UUlm/sieve/wiki/Category-Settings-Guide).

## IMAP email import (optional, admin)

1. Open `Settings -> Mail` and enter your IMAP host, port, username, password, and security mode.
2. Save settings and select the inbox folder to monitor.
3. Use the `IMAP` view to preview inbox emails and analyze selected messages.
4. Processed emails are moved to the `ai_analyzed` folder and appear in `History` with source label `IMAP Import`.
5. If automatic processing is enabled in Mail settings, new inbox emails are imported and analyzed periodically.

## Working with the history view

The `History` view lists all completed analysis runs. For each entry you can:

- **Filter by source** — switch between `All`, `Manual`, and `IMAP` tabs.
- **Filter by handled status** — switch between `All`, `Unhandled`, and `Handled` tabs to focus on mails that still need a response.
- **Search** — filter entries by subject or body content.
- **Send a response** — if the analysis produced a suggested email response and the original sender address
  is known, a `Send Email Response` button appears in the detail panel. Clicking it sends the response via
  SMTP and automatically marks the mail as handled.
- **Toggle handled manually** — use the `Mark handled` / `Unmark` button on any history card to set or
  clear the handled status without sending an email.

## Testing

### Evaluate AI-Backend

This runs a test suite with 6 test cases to evaluate the analyze endpoint of the ai-backend.
This uses real OpenAI llm calls, thus it is not run in CI/CD pipeline.
GPT 5.1 is used for the evaluation of the email response and the summaries.

Steps:

1. Start ai-backend
2. Start Product database and prepare with sample products, see [Product database setup for AI product flow](#product-database-setup-for-ai-product-flow)
3. Set OPENAI_API_KEY in .env
4. Run `uv run evaluate`
