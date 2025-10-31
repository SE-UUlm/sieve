## Backend

The backend's configuration is driven by environment variables.
You can specify variables in a `.env` file in the root directory of the backend (`apps/backend`).
To get started, copy the provided example:

```bash
cp .env.example .env
```

### Environment Variables Table

| Variable       |      Required      |   Default   | Description                            |
| -------------- | :----------------: | :---------: | -------------------------------------- |
| `BACKEND_PORT` | :white_check_mark: |      -      | The port where the backend is served.  |
| `DB_HOST`      | :white_check_mark: | `localhost` | The host where the database is served. |
| `DB_PORT`      | :white_check_mark: |    5432     | The port where the database is served. |
| `DB_USERNAME`  | :white_check_mark: |  postgres   | The username for the database.         |
| `DB_PASSWORD`  | :white_check_mark: |      -      | The password for the database.         |
| `DB_NAME`      | :white_check_mark: |  postgres   | The name of the database.              |
