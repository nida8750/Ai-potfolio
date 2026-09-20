# Nida AI

Portfolio for **Nida Asghar** — AI Agent & Automation Engineer. Phase 1 is a static, data-driven Next.js frontend.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

The app binds to `0.0.0.0` on port **43127**.

Open [http://localhost:43127](http://localhost:43127).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript (`tsc --noEmit`)

## Environment

Copy `frontend/.env.example` to `frontend/.env.local` if needed:

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Phase 2 can swap `frontend/data` for a FastAPI + MongoDB API behind `NEXT_PUBLIC_API_URL`. No backend is required for Phase 1.
