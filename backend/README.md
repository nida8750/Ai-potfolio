# Nida AI Backend

FastAPI backend for the existing Next.js portfolio in `frontend/`.

Phases complete so far:

- **Phase 1** — app foundation, config, health
- **Phase 2** — Supabase client, SQL migrations (AI platform + RLS), typed models
- **Phase 3** — Supabase Auth, `require_user` / `require_admin`, `/api/v1/auth/*`
- **Phase 4** — LangGraph supervisor + specialists, allowlisted tools, `/api/v1/agents`
- **Phase 5** — Conversations, messages, memory, SSE streaming, frontend backend client
- **Phase 6** — RAG ingest/search (parse → chunk → embed → retrieve)
- **Phase 7** — n8n automation products (LeadFlow → ContentFlow)
- **Phase 8** — Dashboard wired to real counts (0 / [] when empty)
- **Phase 9** — Security hardening (rate limits, SSRF, uploads, CORS, logging)
- **Phase 10** — Quality gates: pytest, ruff, mypy
- **Phase 11** — Docker (production Dockerfile + compose)
- **Phase 12** — Final integration (Next.js ↔ FastAPI ↔ stack)

It does not invent credentials, dashboard statistics, or database records.

## Requirements

- Python 3.12+
- The Next.js app continues to run independently on port `43127`
- A Supabase project (for live DB connectivity)

## Setup (Windows)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

## Setup (macOS / Linux)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify:

```bash
curl http://127.0.0.1:8000/health
```

Without Supabase keys, `checks.supabase` is `not_configured`.
With keys + migrations applied, it becomes `ok`.
With keys but tables missing, it becomes `reachable_migrations_pending`.

Health never returns secrets.

## Phase 2 — database migrations

SQL files live in `backend/migrations/`:

| File | Purpose |
| --- | --- |
| `0001_extensions.sql` | `pgcrypto`, `vector` (pgvector) |
| `0002_ai_platform_tables.sql` | agents, conversations, messages, agent_runs, workflows, workflow_runs, knowledge_bases, documents, document_chunks (+ portfolio tables if missing) |
| `0003_ai_platform_rls.sql` | RLS + ownership helpers + knowledge storage policies |

### Compatibility with the existing frontend

The Next.js app already has `frontend/supabase/migrations/0001_init.sql`–`0003_n8n_events.sql`
(`profiles`, `projects`, `notifications`, `audit_logs`, orders, payments, …).

Phase 2 **reuses that shape**:

- `profiles.id` = `auth.users.id` (no separate `auth_user_id`)
- `profiles.name` (not `full_name`)
- `projects.image` (not `image_url`)
- `notifications.read` (not `is_read`) + additive `metadata`

Apply order in the Supabase SQL editor:

1. Frontend `0001_init.sql`, `0002_seed.sql`, `0003_n8n_events.sql` (if not already applied)
2. Backend `0001_extensions.sql`
3. Backend `0002_ai_platform_tables.sql`
4. Backend `0003_ai_platform_rls.sql`

Enable the **pgvector** extension in the Supabase dashboard if the SQL editor
blocks `create extension vector`.

### Credentials you must provide

Put these in `backend/.env` (never commit `.env`):

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Do not invent them. Do not put the service role key in frontend `NEXT_PUBLIC_*` vars.

## Tests / lint / types (Phase 10)

```bash
pip install -e ".[dev]"
pytest
ruff check .
ruff format .
mypy app
```

Phase 10 gates: **37 pytest**, **ruff clean**, **mypy clean** (supabase JSON
typing noise scoped via `pyproject.toml` overrides). Tests do not require
production credentials.

## Environment variables

| Variable | Used for |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service role. Never send to the browser. |
| `LLM_API_KEY` | LLM provider key (later phases) |
| `LLM_MODEL` | Model name |
| `N8N_WEBHOOK_BASE_URL` | n8n webhook origin |
| `N8N_WEBHOOK_SECRET` | Shared secret for webhook HMAC |
| `FRONTEND_URL` | CORS origin for the Next.js app |

## Phase 3 — Auth

Bearer JWT (Supabase access token) → `auth.get_user` → `profiles` row → role.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v1/auth/me` | Current user (requires Bearer token) |
| `POST /api/v1/auth/signup` | Sign up |
| `POST /api/v1/auth/login` | Login |
| `POST /api/v1/auth/logout` | Best-effort logout |
| `POST /api/v1/auth/refresh` | Refresh session |
| `POST /api/v1/auth/forgot-password` | Start reset |
| `POST /api/v1/auth/reset-password` | Complete reset |
| `POST /api/v1/auth/verify-email` | Confirm email |

Dependencies: `get_current_user`, `require_user`, `require_admin`.
Role is never taken from the request body.

Without Supabase keys, auth mutation endpoints return `503 SERVICE_UNAVAILABLE`.

## Phase 4 — Agents

LangGraph graph: `supervisor → {research|rag|automation|support} → validator`.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v1/agents` | Catalog + allowlisted tools |
| `GET /api/v1/agents/{id}` | Agent detail (id or slug) |
| `POST /api/v1/agents/{id}/run` | Run graph (`{"message":"..."}`) |

Allowlisted tools only: `search`, `database_read`, `rag_search`, `project_lookup`, `n8n_workflow_trigger`.

Routing works without `LLM_API_KEY` via heuristics. With a key, the supervisor can use the LLM router.

## Phase 5 — Chat

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v1/conversations` | List current user's conversations |
| `POST /api/v1/conversations` | Create conversation |
| `GET /api/v1/conversations/{id}` | Conversation + messages + agent runs |
| `DELETE /api/v1/conversations/{id}` | Soft-delete / archive |
| `POST /api/v1/conversations/{id}/messages` | Send message (`stream: true` → SSE) |

SSE events (safe only): `agent_selected`, `searching_knowledge`, `tool_running`,
`workflow_running`, `generating_response`, `completed`, `error`.

Frontend client (does not replace existing Next.js `apiRequest`):

- `frontend/lib/api/backend-client.ts`
- `frontend/lib/api/backend-types.ts`
- Set `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000`

Persistence uses Supabase when configured; otherwise an in-memory store for local/dev.
No secrets are stored in conversation metadata.

## Phase 6 — RAG

Pipeline: upload → storage → parse → clean → chunk → embed → search → grounded answer.

| Endpoint | Purpose |
| --- | --- |
| `GET/POST /api/v1/knowledge-bases` | List / create |
| `GET /api/v1/knowledge-bases/{id}` | KB + documents |
| `POST /api/v1/knowledge-bases/{id}/documents` | Upload PDF/TXT/MD/DOCX |
| `POST /api/v1/knowledge-bases/{id}/search` | Top-k similarity search |

Embeddings use OpenAI when `LLM_API_KEY` is set; otherwise a deterministic local
embedder (no invented credentials). Retrieved chunks always include `source`
metadata. Empty results return `grounded: false` — sources are never invented.

Frontend helpers: `listKnowledgeBases`, `createKnowledgeBase`,
`uploadKnowledgeDocument`, `searchKnowledgeBase` in `backend-client.ts`.

## Phase 7 — Business automation (n8n)

| Endpoint | Product |
| --- | --- |
| `POST /api/v1/automation/leadflow` | LeadFlow |
| `POST /api/v1/automation/mailpilot` | MailPilot |
| `POST /api/v1/automation/invoiceflow` | InvoiceFlow |
| `POST /api/v1/automation/supportsync` | SupportSync |
| `POST /api/v1/automation/contentflow` | ContentFlow |
| `GET /api/v1/automation/products` | Catalog |
| `GET /api/v1/automation/runs` | Execution history |
| `GET/POST /api/v1/workflows…` | Generic workflow wrappers |

Dispatch uses the same HMAC scheme as the Next.js n8n client
(`x-nida-timestamp` + `x-nida-signature`). Includes timeout, retries,
idempotency keys, and safe errors. Without `N8N_WEBHOOK_*`, runs are recorded
as `skipped` / `not_configured` — never fake upstream success.

Frontend: `triggerAutomation`, `listAutomationProducts`, `listAutomationRuns`
in `backend-client.ts`. The browser never calls n8n directly.

## Phase 8 — Dashboard

| Endpoint | Audience |
| --- | --- |
| `GET /api/v1/dashboard/overview` | Authenticated user (own AI stats) |
| `GET /api/v1/admin/dashboard` | Admin Bearer |
| `GET /api/v1/internal/dashboard` | Next.js BFF via `X-Internal-Key` |

Metrics (real only): agents, tasks, successful/failed runs, active workflows,
conversations, knowledge bases, documents, recent agent activity, recent
workflow runs, recent users, notifications.

Empty → `0` and `[]`. Never fabricated.

Admin UI (`frontend/app/admin/page.tsx`) shows portfolio overview from the
existing repository **and** AI platform stats from FastAPI when
`INTERNAL_API_KEY` + `BACKEND_URL` are set in the Next.js server env.

## Phase 9 — Security

See [SECURITY.md](SECURITY.md) for the full review checklist.

Highlights: request IDs, rate limits (auth/agents/RAG/n8n/chat), SSRF guards,
upload sniffing, tighter CORS, tool-injection defenses, log redaction.

## Phase 10 — Quality gates

| Gate | Result |
| --- | --- |
| `pytest` | 37 passed |
| `ruff check .` | clean |
| `mypy app` | clean (71 files) |

## Phase 12 — Final integration

See [INTEGRATION.md](INTEGRATION.md).

| Check | Result |
| --- | --- |
| Offline E2E pytest | chat → LangGraph → RAG → n8n (mocked) |
| `GET /api/v1/integration` | honest layer status |
| Next.js BFF | `/api/ai/*` proxies to FastAPI with Supabase token |
| Docker packaging | See [DOCKER.md](DOCKER.md) |

## Phase 11 — Docker

See [DOCKER.md](DOCKER.md).

```powershell
# Full stack (repo root)
docker compose up --build -d

# Backend only
cd backend
docker compose up --build -d
curl http://127.0.0.1:8000/health
```

Images: Python 3.12 backend + Next.js 16 frontend (standalone), non-root users, healthchecks, runtime env via compose/`.env`.

## What is not included yet

Nothing from the original phase plan remains. Optional later: LLM/n8n live keys, product UI panels on top of the `/api/ai/*` BFFs.
