# Integration (Phase 12)

Stack: **Next.js → FastAPI → Supabase / LangGraph / RAG / n8n**.

Nothing is fabricated. Missing keys report `not_configured`. Empty stores
return `0` and `[]`.

## Honest status

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | FastAPI + supabase/llm/n8n checks |
| `GET /api/v1/health` | Same payload in the v1 envelope |
| `GET /api/v1/integration` | Layer list (nextjs, fastapi, supabase, langgraph, rag, n8n, llm, internal_bff) |
| `GET /api/health` (Next.js) | Frontend integration + live FastAPI probe |
| `GET /api/ai/integration` | Stack + optional internal agent catalog |

## Next.js BFF

The browser does not call FastAPI with service-role or internal keys.

| Next.js route | FastAPI target |
| --- | --- |
| `/api/ai/agents` | `/api/v1/agents` |
| `/api/ai/conversations` | `/api/v1/conversations` |
| `/api/ai/conversations/[id]/messages` | `/api/v1/conversations/{id}/messages` |
| `/api/ai/knowledge-bases` | `/api/v1/knowledge-bases` |
| `/api/ai/automation/[product]` | `/api/v1/automation/{product}` |
| `/api/ai/dashboard` | `/api/v1/dashboard/overview` |
| `/api/admin/ai-dashboard` | `/api/v1/internal/dashboard` via `X-Internal-Key` |

User-scoped routes forward the Supabase access token when a session exists.
Local-file-store logins have no FastAPI JWT — those routes return an honest
`503` instead of minting a fake token.

## Environment

Frontend (server-only):

```
BACKEND_URL=http://127.0.0.1:8000
INTERNAL_API_KEY=
```

Backend:

```
FRONTEND_URL=http://localhost:43127
INTERNAL_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
N8N_WEBHOOK_BASE_URL=http://localhost:5678/webhook
N8N_WEBHOOK_SECRET=
```

Use `python backend/scripts/sync_internal_key.py` to copy or generate
`INTERNAL_API_KEY` in both env files without printing it.

## n8n product URLs

When `N8N_WEBHOOK_BASE_URL=http://localhost:5678/webhook`:

- `http://localhost:5678/webhook/nida-ai/leadflow`
- `http://localhost:5678/webhook/nida-ai/mailpilot`
- `http://localhost:5678/webhook/nida-ai/invoiceflow`
- `http://localhost:5678/webhook/nida-ai/supportsync`
- `http://localhost:5678/webhook/nida-ai/contentflow`

Without the secret, runs are recorded as `skipped` / `not_configured`.

## Offline E2E

`pytest tests/test_chat_phase5.py tests/test_knowledge_files.py tests/test_automation_phase7.py tests/test_integration_phase12.py`

covers chat → LangGraph → RAG → n8n (mocked HTTP) without live credentials.
