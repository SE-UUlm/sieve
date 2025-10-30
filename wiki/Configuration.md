## Backend

The backend's configuration is driven by environment variables.
You can specify variables in a `.env` file in the root directory of the backend (`apps/backend`).
To get started, copy the provided example:

```bash
cp .env.example .env
```

### Environment Variables Table

| Variable |      Required      | Default | Description                           |
| -------- | :----------------: | :-----: | ------------------------------------- |
| `PORT`   | :white_check_mark: |    -    | The port where the backend is served. |
