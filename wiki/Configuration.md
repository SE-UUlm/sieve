## Docker Compose Setup

When using Docker Compose, all environment variables should be configured in a `.env` file in the root directory of the repository.
To get started, copy the provided example:

```bash
cp .env.example .env
```

### Environment Variables Table

| Variable              |      Required      |     Default      | Description                                                      |
| --------------------- | :----------------: | :--------------: | ---------------------------------------------------------------- |
| `BACKEND_PORT`        | :white_check_mark: |       5175       | The port where the backend is served.                            |
| `FRONTEND_PORT`       |                    |       3000       | The port where the frontend is served.                           |
| `NEXT_PUBLIC_API_URL` |                    | http://localhost:5175 | The backend API URL used by the frontend.                        |
| `DB_USERNAME`         |                    |     postgres     | The username for the database.                                   |
| `DB_PASSWORD`         | :white_check_mark: |        -         | The password for the database.                                   |
| `DB_NAME`             |                    |     postgres     | The name of the database.                                        |

## Building from Source

### Backend

When building the backend from source (without Docker), you can specify environment variables in a `.env` file 
in the backend directory (`apps/backend`). Copy the provided example:

```bash
cd apps/backend
cp .env.example .env
```

Backend-specific environment variables:

| Variable       |      Required      | Default  | Description                           |
| -------------- | :----------------: | :------: | ------------------------------------- |
| `BACKEND_PORT` | :white_check_mark: |    -     | The port where the backend is served. |
| `DB_USERNAME`  | :white_check_mark: | postgres | The username for the database.        |
| `DB_PASSWORD`  | :white_check_mark: |    -     | The password for the database.        |
| `DB_NAME`      | :white_check_mark: | postgres | The name of the database.             |

### Frontend

The frontend currently does not require specific environment variables for local development from source.
If connecting to a non-default backend URL, you can set `NEXT_PUBLIC_API_URL` in your environment.
