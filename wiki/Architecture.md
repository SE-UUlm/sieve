# Architecture

## System overview

SIEVE is split into three main services:

- Frontend (`apps/frontend`): Next.js UI
- Backend (`apps/backend`): NestJS API, auth, persistence, orchestration
- AI-backend (`apps/ai-backend`): FastAPI service running LLM flows

The frontend talks only to the backend. The backend calls the AI-backend for analysis jobs.

![Overall Architecture](./assets/architecture.svg)

## Backend data model

Core backend entities:

- `User`
- `Email`
- `Job`
- `JobResult`
- `InstanceSettings`
- `ProviderSettings`

Auth entities (`Session`, `Account`, `Verification`) are also persisted.

![Database Schema](./assets/database_schema.svg)

The diagram asset is generated from `wiki/assets/database_schema.d2`.

## Analysis history flow

Email analysis and history are now part of one end-to-end backend/frontend flow:

1. `POST /api/emails` runs AI analysis and persists `Email`, `Job` (`COMPLETED`), and `JobResult` in one transaction.
   The sender address from the request is stored on the `Email` record so it is available later for sending
   a response from the history view.
2. `GET /api/jobs/history` returns completed history entries (newest first, up to 100 items), optionally filtered by `source=MANUAL|IMAP`.
3. Visibility is source-aware:
   - IMAP entries are instance-wide and visible to all users.
   - Manual entries remain user-scoped in the default combined view.
   - `source=MANUAL` applies role-based access (admins can inspect all manual entries).
4. Frontend `History` view provides source tabs (`All`, `Manual`, `IMAP`), a handled-status filter
   (`All`, `Unhandled`, `Handled`), subject/body search, and detailed result inspection.
5. Each history card is labeled by source (`Manual Entry` / `IMAP Import`) so users can distinguish ingestion origin.

### Handled status

Every `Job` carries a `handled` boolean (`false` by default). It tracks whether a mail has been acted upon.

**How a job becomes handled:**

- **Automatic** — when a user sends the generated email response via the `Send Email Response` button
  (in either the `Analyze` or `History` view), the backend marks the corresponding job as handled
  immediately after the SMTP send succeeds.
- **Manual** — any user can toggle the handled state directly from the history list with the `Mark handled` / `Unmark` button on each card.

**API:**

- `PATCH /api/jobs/:jobId/handled` — sets `{ handled: true|false }` on the job. Scoped to the requesting user (admins can update any job).

**Frontend behaviour:**

- Handled jobs show a green `Handled` badge in the history list and in the detail panel header.
- The `Handled` / `Unhandled` filter tabs let users focus on mails that still need attention.
- The `Send Email Response` button in the history detail panel is shown whenever the analysis result
  contains a generated email response and a sender address is known. After a successful send the button
  is replaced by a confirmation indicator and the job is marked handled.

## IMAP integration flow

IMAP ingestion is handled end-to-end by backend orchestration with frontend admin controls:

1. Admin configures mailbox connection in `Settings -> Mail` (`host`, `port`, credentials, security, inbox folder, auto-process toggle).
2. Backend stores IMAP settings in `InstanceSettings` and encrypts the IMAP password at rest.
3. Frontend `IMAP` view lists current inbox emails and allows selecting messages for analysis (`POST /api/imap/analyze-selected`).
4. Backend IMAP processing writes results into the same `Email`/`Job`/`JobResult` pipeline with `Email.source = IMAP`.
5. Processed messages are moved to `ai_analyzed` to avoid repeated analysis.
6. When auto-process is enabled, backend polls IMAP every minute and processes newly arriving emails.
7. Backend also emits notification events over the `notifications` WebSocket namespace for newly processed IMAP emails.

## AI-backend flow architecture

The AI-backend runs a top-level LangGraph workflow that:

1. categorizes an email into configured categories
2. executes the configured flow per category (`simple` or `product`)
3. composes one overall response
4. computes a confidence assessment

### Top-level flow

![Top Level Graph](./assets/ai_backend_top_level_graph.svg)

### Simple flow

Produces:

- structured response (`flow.structured_response_schema`)
- optional customer response part
- summary

![Simple Flow Graph](./assets/ai_backend_simple_graph.svg)

### Product flow

Extends the simple flow with a database search step (`db_step`) to retrieve related products.
If product DB is not configured, product flow cannot resolve related products.

![Product Flow Graph](./assets/ai_backend_product_graph.svg)
