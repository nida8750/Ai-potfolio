# Security (Phase 9)

This backend treats empty credentials as **not configured**. It never invents
keys, tokens, dashboard statistics, or database rows.

## Identity and roles

- User identity comes only from a validated Supabase access token plus the
  `profiles` row.
- `user_id` and `role` in request bodies are ignored.
- Admin routes use `require_admin`. The Next.js admin BFF uses
  `X-Internal-Key` (`INTERNAL_API_KEY`). Never put that key in `NEXT_PUBLIC_*`.

## Transport and CORS

- CORS allows only `FRONTEND_URL`.
- Allowed headers: `Authorization`, `Content-Type`, `Accept`, `X-Request-ID`,
  `X-Internal-Key`, `Idempotency-Key`.
- Every response can carry `X-Request-ID`.

## Rate limits

Per-IP limits on auth, agent runs, chat, RAG upload/search, and n8n triggers.
See `app/middleware/rate_limit.py`.

## Uploads

- Allowed types: PDF, TXT, MD, DOCX.
- Magic-byte sniffing rejects extension spoofing (`sniff_upload`).
- Empty files are rejected. Storage paths stay server-side.

## SSRF / n8n

- External URLs cannot target private or metadata hosts.
- Production n8n must be HTTPS.
- Local `http://localhost` / `127.0.0.1` is allowed only in development.
- HMAC: `x-nida-timestamp` + `x-nida-signature`. Secrets are never returned.

## Tools and agents

Allowlisted tools only: `search`, `database_read`, `rag_search`,
`project_lookup`, `n8n_workflow_trigger`. Shell, SQL, eval, and nested
executable fields are rejected.

## Logging

`redact_for_logs` strips bearer tokens, API keys, JWTs, and webhook secrets.
Health and integration endpoints never echo credentials.

## Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` exists only in server env
- [ ] `INTERNAL_API_KEY` exists only in Next.js server env + FastAPI env
- [ ] `N8N_WEBHOOK_SECRET` is not committed
- [ ] Production CORS origin is the real frontend URL
- [ ] RLS migrations applied before serving user data from Supabase
