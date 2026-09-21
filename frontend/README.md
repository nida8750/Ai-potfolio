# Nida AI platform

Portfolio and service platform for Nida Asghar / Nida AI — AI Agent &
Automation Engineer. A public marketing site, a customer dashboard, and an
admin console in one Next.js App Router application.

## Run

```bash
cd frontend
npm install
npm run dev
```

Dev server: `http://localhost:43127` (bound to `0.0.0.0`).

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test       # unit and settlement tests
npm run test:api   # end-to-end API tests, needs the dev server running
npm run build      # production build
```

The first account to sign up becomes the administrator. Everyone after that is
a normal user.

`npm run test:api` signs accounts up as it runs, so start the server with
raised quotas for it and reset the store first:

```bash
rm -rf .data && RATE_LIMIT_MULTIPLIER=20 npm run dev
```

Against normal quotas the suite skips the tests it cannot set up rather than
reporting false failures.

## Stack

- Next.js 16 App Router, TypeScript (strict), Tailwind CSS 4
- Framer Motion, Lucide React
- Zod for server-side validation
- AWS SDK v3 for Cognito, DynamoDB, and S3
- Stripe SDK, PayPal REST

## What runs without any credentials

The platform is fully usable locally with no AWS, payment, or n8n
configuration:

- Data is stored in `./.data/store.json` and seeded from `data/*.ts`.
- Sign-up, verification, sign-in, and password reset use a local credential
  store with scrypt hashes. Because no mail is sent, verification and reset
  codes are returned in the response and shown in the UI outside production.
- Checkout is disabled and says so. Nothing pretends to take payment.
- Contact submissions are stored and report that no email was sent.

Switching integrations on is a matter of setting environment variables; see
`.env.example`, `docs/aws-infrastructure.md`, and
`docs/automation-and-payments.md`.

## Layout

```
app/
  (marketing)/       public site
  (account)/         login, signup, forgot and reset password
  dashboard/         customer area, auth required
  admin/             admin console, ADMIN role required
  api/               route handlers
components/          ui primitives, marketing sections, app and admin views
lib/
  api/               route wrapper and browser fetch client
  auth/              sessions, guards, sign-in flows
  aws/               Cognito, DynamoDB, and S3 clients
  data/              repositories, seed data, mutations
  n8n/               signed dispatch and domain events
  payments/          provider interface, Stripe, PayPal, settlement
  security/          logging, rate limiting, sanitizing, HTTP helpers
  validation/        Zod schemas
types/               shared domain types
docs/                infrastructure and integration notes
tests/               unit, settlement, and API suites
```

## Security posture

- Authorization is enforced on the server in every page and route handler.
  `proxy.ts` only adds a redirect for signed-out visitors.
- Roles are read from the datastore, never from the request.
- Users can only read their own orders, inquiries, and notifications.
- Order amounts come from the stored service price; a client-submitted price
  is ignored.
- Payment webhooks are signature-verified, deduplicated by event id, and
  checked against the order amount.
- Secrets are read server-side only. `NEXT_PUBLIC_*` is limited to the app URL
  and the Stripe publishable key.
- Logs redact anything that looks like a secret and never include payment
  details.

## Known limitations

- AWS, Stripe, PayPal, and n8n are implemented but unconfigured and therefore
  untested against live services.
- Rate limiting is per instance in memory. A multi-instance deployment needs a
  shared store.
- The local file datastore is development only. Production should run
  `DATA_STORE=dynamodb`. It also triggers a Turbopack build warning about
  dynamic filesystem access.
- No AI features are implemented. The service boundaries are in place for a
  later phase.
