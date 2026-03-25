This guide will help you set up your development environment and get your first code changes running.

## Prerequisites

First, make sure you have installed the following:

- [Docker](https://www.docker.com/get-started/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js 22/23](https://nodejs.org/en)
- IDE of your choice (e.g. [WebStorm](https://www.jetbrains.com/webstorm/download/) or
  [VS Code](https://code.visualstudio.com/download))

## Docker Setup (Recommended)

The fastest way to get started is to use the provided Docker setup, which runs the entire stack
(database, backend, and frontend) with a single command.

Before you begin, ensure you have configured the necessary environment variables.
For a detailed guide on all configuration options, see the
**[Configuration](https://github.com/SE-UUlm/sieve/wiki/Configuration)** page.

1. Clone the repository:

   ```bash
   git clone git@github.com:SE-UUlm/sieve.git
   cd sieve
   ```

2. Copy the example environment file and configure it:

   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

   Generate an encryption key for instance settings secrets:

   ```bash
   SETTINGS_ENCRYPTION_KEY=$(openssl rand -base64 32)
   ```

   Demo users are disabled by default (`SEED_DEMO_USERS=false`).
   If you want demo users, set `SEED_DEMO_USERS=true` and provide both
   `SEED_ADMIN_PASSWORD` and `SEED_USER_PASSWORD`.

3. Start all services using Docker Compose:

   ```bash
   docker compose up
   ```

   If you want to force local image builds (`docker compose up --build`), generate clients first:

   ```bash
   cd apps/backend
   pnpm install
   pnpm run generate:clients
   cd ../..
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Backend API on port 5175 (configurable via `BACKEND_PORT`)
   - Frontend on port 3000 (configurable via `FRONTEND_PORT`)
   - AI-Backend on port 8000

4. Access the application:
   - Backend API: `http://localhost:5175`
   - Frontend: `http://localhost:3000`
     - Backend is also accessible at `http://localhost:3000/api`
     - This proxying is configured in `next.config.ts`
   - AI-Backend: `http://localhost:8000`

   After the first admin login, configure provider credentials and model
   settings in `Settings -> Provider` (active provider, provider API keys, and
   simple/complex model identifiers).

   You can configure analysis categories in `Settings -> Category` by editing
   the categories JSON. Each category must provide `name`, `description`, and a
   `flow` object with `flow.name` (`simple` or `product`) and
   `flow.structured_response_schema`.

### Running Individual Services

You can also run services individually using Docker Compose profiles:

- Run only the database:

  ```bash
  docker compose --profile db-only up
  ```

- Run only the backend (with database):

  ```bash
  docker compose --profile backend-only up
  ```

- Run only the frontend:

  ```bash
  docker compose --profile frontend-only up
  ```

- Run only the ai-backend:

  ```bash
  docker compose --profile ai-backend-only up
  ```

## Building from Source

If you prefer more control over the development environment, you can build and run each service from source.

### Backend

1. Navigate to the backend directory:

   ```bash
   cd apps/backend
   ```

2. Install all dependencies using `pnpm`:

   ```bash
   pnpm install
   ```

3. Configure environment variables (copy `.env.example` to `.env` and edit as needed)

   Ensure `SETTINGS_ENCRYPTION_KEY` is set (base64-encoded 32-byte value), for example:

   ```bash
   SETTINGS_ENCRYPTION_KEY=$(openssl rand -base64 32)
   ```

4. Generate the Prisma client (required after a fresh clone and after Prisma schema changes):

   ```bash
   pnpm run generate:client:prisma
   ```

5. Push Prisma schema to database:

   ```bash
   pnpm exec prisma db push
   ```

   This is only necessary the first time and after a schema change.

6. Optional: Seed demo users:

   ```bash
   # In apps/backend/.env:
   # SEED_DEMO_USERS=true
   # SEED_ADMIN_PASSWORD=<strong password>
   # SEED_USER_PASSWORD=<strong password>
   pnpm exec prisma db seed
   ```

   If `SEED_DEMO_USERS` is not `true`, the seed command skips demo user creation.

7. Run the backend:

   **Option A** - Development mode (auto-reload on file changes):

   ```bash
   pnpm run dev
   ```

   This runs the NestJS server using `ts-node` and watches for file changes.

   **Option B** - Production mode (compiled output):

   ```bash
   pnpm run build
   pnpm run prod
   ```

   This first compiles the TypeScript source to JavaScript in the `/dist` directory,
   then starts the server using Node.

### Frontend

1. Navigate to the frontend directory:

   ```bash
   cd apps/frontend
   ```

2. Install all dependencies using `pnpm`:

   ```bash
   pnpm install
   ```

3. Generate API clients in the backend (required after a fresh clone and after backend API changes):

   ```bash
   cd ../backend
   pnpm run generate:clients
   cd ../frontend
   ```

4. Run the frontend:

   **Option A** - Development mode (with hot reload):

   ```bash
   pnpm run dev
   ```

   This starts the Next.js development server with hot module replacement.

   To enable API mocking (backend not needed for very simple tests), the following command can be used:

   ```bash
   ENABLE_MOCK=true pnpm run dev
   ```

   **Option B** - Production mode:

   ```bash
   pnpm run build
   pnpm run start
   ```

   This builds the optimized production bundle and starts the production server.

### AI-Backend

1. Prerequisites:
   - Python 3.10 or higher

2. Install uv

   Options:
   - Homebrew (MacOS): `brew install uv`
   - Other System Package Managers
   - Other options: [UV Docs](https://docs.astral.sh/uv/getting-started/installation/)

3. Navigate to the AI-Backend directory:

   ```bash
   cd apps/ai-backend
   ```

4. Configure environment variables

   Copy `.env.example` to `.env` if needed.
   In the standard flow, no default variable is required because the backend provides
   the OpenAI API key per request from instance settings.

5. Start AI-Backend in dev mode with auto-reload:

   ```bash
   uv run dev
   ```

   Dependencies are automatically installed
