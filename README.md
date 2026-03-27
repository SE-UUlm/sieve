# SIEVE

> **S**tructuring **I**ncoming **E**mails for **V**aluable **E**xtraction

SIEVE is a web application that automatically structures, analyzes, and enriches incoming emails with company-internal
knowledge. Relevant contents are extracted via an LLM-based backend and transformed into structured data, enabling
faster processing and supporting standardized workflows.

This repository contains the backend, the frontend and the ai-backend of the SIEVE application.

## Getting Started

### Quick Start with Docker

The easiest way to run the entire application stack:

```bash
# Clone the repository
git clone git@github.com:SE-UUlm/sieve.git
cd sieve

# Copy and configure environment variables
cp .env.example .env
# Required for encrypted instance settings (32-byte key, base64):
# SETTINGS_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Start all services
docker compose up
```

If you build images locally (`docker compose up --build`) or run from source, generate clients first:

```bash
cd apps/backend
pnpm install
pnpm run generate:clients
cd ../..
```

After the first admin login, configure provider credentials and model settings in `Settings -> Provider`
(active provider, provider API keys, and simple/complex model identifiers).
You can also configure analysis categories in `Settings -> Category` by editing the categories JSON
(`name`, `description`, and `flow` with `flow.name` + `flow.structured_response_schema`).

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5175
- AI-Backend: http://localhost:8000

For detailed setup instructions, building from source, and configuration options, see the
[Getting Started](https://github.com/SE-UUlm/sieve/wiki/Getting-Started) guide.
