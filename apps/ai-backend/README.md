## Description

The AI-Backend handles all LLM and agent related tasks.

## Getting Started

1. Prerequisites:
   - Python 3.10 or higher

2. Install uv

   Options:
   - Homebrew (MacOS): `brew install uv`
   - Other System Package Managers
   - Other options: https://docs.astral.sh/uv/getting-started/installation/

3. Configure environment variables

   Copy `.env.example` to `.env` and set the `OPENAI_API_KEY` variable.

4. Start AI-Backend in dev mode with auto-reload:

   ```bash
   uv run dev
   ```

   Dependencies are automatically installed

## Run Tests

```bash
uv run test
```

## Run Linter

```bash
uv run lint
```

## Run Formatter

```bash
uv run format
```

## Swagger OpenAPI

API documentation is available at http://localhost:8000/docs
