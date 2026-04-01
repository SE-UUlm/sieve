# Contributing

This page describes the expected local workflow for code and documentation changes.

## Branching and pull requests

1. Create a branch from `develop`.
2. Keep changes scoped to one topic per pull request.
3. Use the pull request template in `.github/pull_request_template.md`.
4. Ensure relevant checks pass before requesting review.

## Local quality checks

Run checks in the affected app(s):

### Frontend

```bash
cd apps/frontend
pnpm install
pnpm run format
pnpm run lint
pnpm run build
```

### Backend

```bash
cd apps/backend
pnpm install
pnpm run format
pnpm run generate:client:prisma
pnpm run lint
pnpm run build
pnpm run test
```

### AI-backend

```bash
cd apps/ai-backend
uv sync
uv run format
uv run lint
uv run typecheck
uv run test
```

## API client generation

When backend OpenAPI-relevant endpoints or DTOs change, regenerate frontend clients:

```bash
cd apps/backend
pnpm run generate:clients
```

This updates `apps/frontend/src/lib/client` (generated code).

## Database changes

The backend currently uses `prisma db push` in local/dev deployment workflows.
If you change `apps/backend/prisma/schema.prisma`, make sure database setup steps and related docs stay in sync.

## Documentation changes

Documentation lives in:

- root `README.md` (short project entry point)
- `wiki/` (detailed documentation)

For documentation updates, keep links valid and run:

```bash
pnpm dlx markdownlint-cli@0.45.0 --config .github/markdownlint.json **/*.md
```

## Commit and review expectations

- Keep commits focused and descriptive.
- Avoid unrelated refactors in feature/fix PRs.
- Add or update tests when behavior changes.
- Update docs when user-facing behavior, setup, or configuration changes.
