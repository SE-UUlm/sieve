## Description

The AI-Backend handles all LLM and agent related tasks.

## Getting Started

1. Prerequisites:

    - Python 3.10 or higher

2. Install Poetry

    Options:

    - Homebrew (MacOS): `brew install poetry`
    - Other System Package Managers
    - Other Options: https://python-poetry.org/docs/

3. Install dependencies

    ```bash
    poetry install
    ```

4. Configure environment variables

    Copy `.env.example` to `.env` and set the `OPENAI_API_KEY` variable.

5. Start AI-Backend in dev mode with auto-reload:

    ```bash
    poetry run dev
    ```

## Run Tests

```bash
poetry run test
```

## Run Linter

```bash
poetry run lint
```

## Run Formatter

```bash
poetry run format
```

## Swagger OpenAPI

API documentation is available at http://localhost:8000/docs
