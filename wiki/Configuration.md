## Docker Compose Setup

When using Docker Compose, all environment variables should be configured in a `.env` file in the root directory of the repository.
To get started, copy the provided example:

```bash
cp .env.example .env
```

### Environment Variables Table

| Variable              |      Required      |         Default         | Description                                                                                               |
| --------------------- | :----------------: | :---------------------: | --------------------------------------------------------------------------------------------------------- |
| `BACKEND_PORT`        | :white_check_mark: |            -            | The port where the backend is served.                                                                     |
| `FRONTEND_PORT`       |                    |          3000           | The port where the frontend is served.                                                                    |
| `NEXT_PUBLIC_API_URL` |                    | `http://localhost:5175` | The backend API URL used by the frontend to proxy to the backend. Only works in dev mode or at build time |
| `DB_USERNAME`         | :white_check_mark: |            -            | The username for the database.                                                                            |
| `DB_PASSWORD`         | :white_check_mark: |            -            | The password for the database.                                                                            |
| `DB_HOST`             | :white_check_mark: |            -            | The host of the database.                                                                                 |
| `DB_PORT`             | :white_check_mark: |            -            | The port of the database.                                                                                 |
| `DB_NAME`             | :white_check_mark: |            -            | The name of the database.                                                                                 |
| `RESTART_POLICY`      |                    |        `always`         | The database container restart policy.                                                                    |
| `BETTER_AUTH_SECRET`  | :white_check_mark: |            -            | The secret for Better Auth.                                                                               |
| `BETTER_AUTH_URL`     | :white_check_mark: | `http://localhost:5175` | Base URL for Better Auth.                                                                                 |
| `TRUSTED_ORIGINS`     |                    | `http://localhost:3000` | Comma-separated list of trusted origins.                                                                  |
| `AI_BACKEND_URL`      | :white_check_mark: |            -            | Base URL for AI-Backend instance.                                                                         |
| `SEED_DEMO_USERS`     |                    |         `false`         | Enables creation of demo admin/user accounts during backend seed execution.                               |
| `SEED_ADMIN_NAME`     |                    |         `Admin`         | Display name for demo admin user.                                                                         |
| `SEED_ADMIN_EMAIL`    |                    |   `admin@example.com`   | Email for demo admin user.                                                                                |
| `SEED_ADMIN_PASSWORD` |                    |            -            | Password for demo admin user. Required when `SEED_DEMO_USERS=true`.                                       |
| `SEED_USER_NAME`      |                    |      `Alice Smith`      | Display name for demo user.                                                                               |
| `SEED_USER_EMAIL`     |                    |   `alice@example.com`   | Email for demo user.                                                                                      |
| `SEED_USER_PASSWORD`  |                    |            -            | Password for demo user. Required when `SEED_DEMO_USERS=true`.                                             |
| `ENABLE_MOCK`         |                    |         `false`         | Enable API mocking for frontend development.                                                              |
| `OPENAI_API_KEY`      | :white_check_mark: |            -            | The API key for the OpenAI API.                                                                           |

## Building from Source

### Backend

When building the backend from source (without Docker), you can specify environment variables in a `.env` file
in the backend directory (`apps/backend`). Copy the provided example:

```bash
cd apps/backend
cp .env.example .env
```

Backend-specific environment variables:

| Variable              |      Required      |         Default         | Description                                                         |
| --------------------- | :----------------: | :---------------------: | ------------------------------------------------------------------- |
| `BACKEND_PORT`        | :white_check_mark: |            -            | The port where the backend is served.                               |
| `DB_USERNAME`         | :white_check_mark: |            -            | The username for the database.                                      |
| `DB_PASSWORD`         | :white_check_mark: |            -            | The password for the database.                                      |
| `DB_HOST`             | :white_check_mark: |            -            | The host of the database.                                           |
| `DB_PORT`             | :white_check_mark: |            -            | The port of the database.                                           |
| `DB_NAME`             | :white_check_mark: |            -            | The name of the database.                                           |
| `RESTART_POLICY`      |                    |        `always`         | The database container restart policy.                              |
| `BETTER_AUTH_SECRET`  | :white_check_mark: |            -            | The secret for Better Auth.                                         |
| `BETTER_AUTH_URL`     | :white_check_mark: | `http://localhost:5175` | Base URL for Better Auth.                                           |
| `TRUSTED_ORIGINS`     |                    | `http://localhost:3000` | Comma-separated list of trusted origins.                            |
| `AI_BACKEND_URL`      | :white_check_mark: |            -            | Base URL for AI-Backend instance.                                   |
| `SEED_DEMO_USERS`     |                    |         `false`         | Enables creation of demo admin/user accounts during seed execution. |
| `SEED_ADMIN_NAME`     |                    |         `Admin`         | Display name for demo admin user.                                   |
| `SEED_ADMIN_EMAIL`    |                    |   `admin@example.com`   | Email for demo admin user.                                          |
| `SEED_ADMIN_PASSWORD` |                    |            -            | Password for demo admin user. Required when `SEED_DEMO_USERS=true`. |
| `SEED_USER_NAME`      |                    |      `Alice Smith`      | Display name for demo user.                                         |
| `SEED_USER_EMAIL`     |                    |   `alice@example.com`   | Email for demo user.                                                |
| `SEED_USER_PASSWORD`  |                    |            -            | Password for demo user. Required when `SEED_DEMO_USERS=true`.       |

### Frontend

| Variable              | Required |         Default         | Description                                                                                               |
| --------------------- | :------: | :---------------------: | --------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` |          | `http://localhost:5175` | The backend API URL used by the frontend to proxy to the backend. Only works in dev mode or at build time |

### AI-Backend

When building the ai-backend from source (without Docker), you can specify environment variables in a `.env` file
in the backend directory (`apps/ai-backend`). Copy the provided example:

```bash
cd apps/ai-backend
cp .env.example .env
```

| Variable         |      Required      | Default | Description                     |
| ---------------- | :----------------: | :-----: | ------------------------------- |
| `OPENAI_API_KEY` | :white_check_mark: |    -    | The API key for the OpenAI API. |
