FROM python:3.10-alpine AS base

ENV VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH"


FROM base AS builder

ENV POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=1 \
    POETRY_CACHE_DIR=/tmp/poetry_cache

WORKDIR /app

# Install Poetry
RUN pip install poetry==2

# Install dependencies
COPY pyproject.toml poetry.lock ./
RUN poetry install --only main --no-root


FROM base AS runtime

# Copy dependencies
COPY --from=builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}

# Copy app code
COPY ./src /app/src

WORKDIR /app

CMD ["fastapi", "run", "src/ai_backend/main.py", "--port", "8000"]
