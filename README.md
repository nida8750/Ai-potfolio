# Nida AI

Portfolio and service platform for **Nida Asghar** — AI Agent & Automation
Engineer. A public marketing site, a customer dashboard, and an admin console
built as one Next.js App Router application in `frontend/`.

## Run locally

```bash
cd frontend
npm install
npm run dev
```

The app binds to `0.0.0.0` on port **43127**.

Open [http://localhost:43127](http://localhost:43127).

The first account that signs up becomes the administrator.

## Scripts

Run these from `frontend/`:

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript (`tsc --noEmit`)
- `npm run test` — unit and payment settlement tests
- `npm run test:api` — end-to-end API tests against a running dev server

## Environment

Copy `frontend/.env.example` to `frontend/.env.local`. Everything runs without
credentials: data is kept in a local file store, authentication uses a local
credential store, and payments and automation stay switched off until their
variables are set.

Never put AWS, Stripe, PayPal, or n8n secrets in `NEXT_PUBLIC_*`.

## Documentation

- `frontend/README.md` — application overview, layout, and security posture
- `frontend/docs/aws-infrastructure.md` — DynamoDB, Cognito, S3, IAM
- `frontend/docs/automation-and-payments.md` — n8n, Stripe, PayPal
