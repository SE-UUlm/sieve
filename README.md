<div align="center">
    <picture>
        <img alt="SIEVE Logo" width="350" src="apps/frontend/public/sieve-logo-with-text.svg" />
    </picture>
    <p><em><strong>S</strong>tructuring <strong>I</strong>ncoming <strong>E</strong>mails for <strong>V</strong>aluable <strong>E</strong>xtraction</em></p>
</div>

<div align="center">
    <a href="https://github.com/SE-UUlm/sieve/actions/workflows/code-quality-checks-frontend.yml">
        <img alt="Frontend Code Quality Checks" src="https://img.shields.io/github/actions/workflow/status/SE-UUlm/sieve/code-quality-checks-frontend.yml?logo=github&label=Frontend%20Code%20Quality">
    </a>
    <a href="https://github.com/SE-UUlm/sieve/actions/workflows/code-quality-checks-backend.yml">
        <img alt="Backend Code Quality Checks" src="https://img.shields.io/github/actions/workflow/status/SE-UUlm/sieve/code-quality-checks-backend.yml?logo=github&label=Backend%20Code%20Quality">
    </a>
    <a href="https://github.com/SE-UUlm/sieve/actions/workflows/code-quality-checks-ai-backend.yml">
        <img alt="AI Backend Code Quality Checks" src="https://img.shields.io/github/actions/workflow/status/SE-UUlm/sieve/code-quality-checks-ai-backend.yml?logo=github&label=AI%20Backend%20Code%20Quality">
    </a>
    <a href="https://github.com/SE-UUlm/sieve/actions/workflows/deploy.yml">
        <img alt="Deployment Status" src="https://img.shields.io/github/actions/workflow/status/SE-UUlm/sieve/deploy.yml?logo=github&label=Deployment">
    </a>
    <a href="https://sieve.informatik.uni-ulm.de">
        <img alt="SIEVE Website" src="https://custom-icon-badges.demolab.com/badge/SIEVE_Website-gray?logo=sieve-logo">
    </a>
    <a href="https://github.com/SE-UUlm/sieve/wiki">
        <img alt="GitHub Wiki" src="https://img.shields.io/badge/Wiki-grey?logo=github">
    </a>
    <a href="https://deepwiki.com/SE-UUlm/sieve">
        <img alt="Ask DeepWiki" src="https://deepwiki.com/badge.svg">
    </a>
    <a href="https://github.com/SE-UUlm/sieve/blob/main/LICENSE">
        <img alt="License" src="https://img.shields.io/github/license/SE-UUlm/sieve?label=License">
    </a>
</div>

---

SIEVE is a web application that structures and analyzes incoming emails with LLM support and enriches results with
internal knowledge and product data.
Emails can be analyzed manually or imported from IMAP inboxes, and all completed runs are available in the History view
with source-aware filtering.

This repository contains:

- `apps/frontend` (Next.js UI)
- `apps/backend` (NestJS API + database orchestration)
- `apps/ai-backend` (FastAPI + LangGraph analysis flows)

## Getting Started

Run the full stack with Docker Compose:

```bash
git clone git@github.com:SE-UUlm/sieve.git
cd sieve

cp .env.example .env
# Generate a key and add it as SETTINGS_ENCRYPTION_KEY in .env
openssl rand -base64 32

docker compose up
```

If you build images locally with `docker compose up --build`, generate clients first:

```bash
cd apps/backend
pnpm install
pnpm run generate:clients
```

After startup, open:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5175/api`
- Backend docs: `http://localhost:5175/docs`
- AI-Backend docs: `http://localhost:8000/docs`

For detailed setup, configuration, architecture, and contribution workflow, use the wiki:

- [Home](https://github.com/SE-UUlm/sieve/wiki)
- [Getting Started](https://github.com/SE-UUlm/sieve/wiki/Getting-Started)
- [Configuration](https://github.com/SE-UUlm/sieve/wiki/Configuration)
- [Architecture](https://github.com/SE-UUlm/sieve/wiki/Architecture)
- [Contributing](https://github.com/SE-UUlm/sieve/wiki/Contributing)
