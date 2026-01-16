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

3. Start all services using Docker Compose:

   ```bash
   docker compose up
   ```

   This will start:

   - PostgreSQL database on port 5432
   - Backend API on port 5175 (configurable via `BACKEND_PORT`)
   - Frontend on port 3000 (configurable via `FRONTEND_PORT`)

4. Access the application:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5175`

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

## Building from Source

If you prefer more control over the development environment, you can build and run each service from source.

### Backend

1. Navigate to the backend directory:

   ```bash
   cd apps/backend
   ```

2. Install all dependencies using `npm`:

   ```bash
   npm install
   ```

3. Configure environment variables (copy `.env.example` to `.env` and edit as needed)

4. Run the backend:

   **Option A** - Development mode (auto-reload on file changes):

   ```bash
   npm run dev
   ```

   This runs the NestJS server using `ts-node` and watches for file changes.

   **Option B** - Production mode (compiled output):

   ```bash
   npm run build
   npm run prod
   ```

   This first compiles the TypeScript source to JavaScript in the `/dist` directory,
   then starts the server using Node.

### Frontend

1. Navigate to the frontend directory:

   ```bash
   cd apps/frontend
   ```

2. Install all dependencies using `npm`:

   ```bash
   npm install
   ```

3. Run the frontend:

   **Option A** - Development mode (with hot reload):

   ```bash
   npm run dev
   ```

   This starts the Next.js development server with hot module replacement.

   **Option B** - Production mode:

   ```bash
   npm run build
   npm run start
   ```

   This builds the optimized production bundle and starts the production server.
