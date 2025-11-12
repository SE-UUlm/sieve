# SIEVE

> **S**tructuring **I**ncoming **E**mails for **V**aluable **E**xtraction

SIEVE is a web application that automatically structures, analyzes, and enriches incoming emails with company-internal
knowledge. Relevant contents are extracted via an LLM-based backend and transformed into structured data, enabling
faster processing and supporting standardized workflows.

This repository contains the backend, as well as the frontend of the SIEVE application.

## Getting Started

### Quick Start with Docker

The easiest way to run the entire application stack:

```bash
# Clone the repository
git clone git@github.com:SE-UUlm/sieve.git
cd sieve

# Copy and configure environment variables
cp .env.example .env

# Start all services
docker compose up
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5175

For detailed setup instructions, building from source, and configuration options, see the
[Getting Started](https://github.com/SE-UUlm/sieve/wiki/Getting-Started) guide.
