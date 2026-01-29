FROM python:3.10-alpine AS base

ENV VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH" \
    UV_NO_DEV=1


FROM base AS builder

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.9.27 /uv /uvx /bin/

# Install dependencies
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project


FROM base AS runtime

# Copy dependencies
COPY --from=builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}

# Copy app code
COPY ./src /app/src

WORKDIR /app

CMD ["fastapi", "run", "src/ai_backend/main.py", "--port", "8000"]
