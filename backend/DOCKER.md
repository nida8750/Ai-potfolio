# Docker (Phase 11)

Images stay non-root. Runtime secrets come from env files — never bake keys
into the image.

## Repo root (frontend + backend)

```powershell
docker compose up --build -d
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:43127/api/health
```

| Service | Container | Host port |
| --- | --- | --- |
| FastAPI | `nida-ai-backend` | `8000` |
| Next.js | `nida-ai-frontend` | `43127` |

The frontend container talks to FastAPI at `http://backend:8000`. Browsers
use `NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000` only for documented
public health checks; authenticated AI calls go through Next.js `/api/ai/*`.

## Backend only

```powershell
cd backend
docker compose up --build -d
curl http://127.0.0.1:8000/health
```

## Image rules

- Python 3.12 slim, multi-stage venv build
- `useradd` UID 10001, `USER app`
- Healthcheck hits `/health` (no secrets)
- `backend/.env` and `frontend/.env.local` are optional `env_file`s

Empty `${VAR:-}` overrides are not used, so compose cannot wipe keys that
were loaded from `env_file`.

## Verify

```powershell
docker compose ps
docker compose logs backend --tail 50
```

`checks.llm` / `checks.n8n` stay `not_configured` until you provide real
keys. Do not invent them.
