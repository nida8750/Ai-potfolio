# Supabase

The Next.js app talks to Supabase project `wpdslwonqowelbrublju` through the
existing Route Handlers. Public URL:

`https://wpdslwonqowelbrublju.supabase.co`

Nothing is faked as live. The service role key, the anon key, and a real
database password are all still missing in this environment, so the app
keeps using the local file store and the local credential store.

## Environment

```
NEXT_PUBLIC_SUPABASE_URL=https://wpdslwonqowelbrublju.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=postgresql://postgres:@db.wpdslwonqowelbrublju.supabase.co:5432/postgres
```

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` may be read
  by the browser for the Auth cookie client.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. The process refuses to start if
  it is renamed `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.
- `DATABASE_URL` is server-only, used for direct Postgres work such as applying
  migrations. It must never be given a `NEXT_PUBLIC_` prefix. The example URI
  has an empty password on purpose.

`DATA_STORE=auto` (the default) selects Supabase only when the URL, anon key,
and service role key are all real. A blank value or `[YOUR-PASSWORD]` is
treated as missing.

## Apply the schema

`is_admin()` is created after `profiles` so a fresh apply can resolve the
relation. Direct `db.<ref>.supabase.co:5432` may be unreachable from IPv4-only
runtimes; the session pooler in `ap-south-1` is the fallback host.

When applying from a machine that can reach Postgres:

1. Open the SQL editor for `wpdslwonqowelbrublju`, or connect with `sslmode=require`.
2. Run `supabase/migrations/0001_init.sql`.
3. Run `supabase/migrations/0002_seed.sql`.

The Next.js repository also seeds services, projects, and settings if those
tables are empty the first time it connects with the service role.

## Schema

| Table | Purpose | Public / RLS |
| --- | --- | --- |
| `profiles` | Application user, `id` = `auth.users.id` | Own row; admin all. Role and status cannot be changed by the owner. |
| `services` | Catalog | Select when `is_active`; admin writes |
| `projects` | Portfolio | Select when `is_published`; admin writes |
| `inquiries` | Contact and service requests | Anyone may insert; owner or admin may read; admin updates |
| `orders` | Service orders | Owner or admin |
| `payments` | Payment records | Owner or admin read |
| `notifications` | In-app alerts | Owner |
| `audit_logs` | Admin activity | Admin read |
| `processed_events` | Webhook idempotency | No policies; service role only |
| `platform_settings` | Currency and checkout flags | Public read; admin write |

The first `auth.users` row becomes `ADMIN` via `handle_new_user`. Later
sign-ups are `USER`.

Storage bucket `assets` is private. Signed upload URLs are minted server-side
for `avatars/{userId}/…`, `projects/…`, and `documents/…`.

## How the app uses it

- `lib/supabase/server.ts` — anon-key Auth client, cookie session
- `lib/supabase/admin.ts` — service-role client for Route Handlers
- `lib/data/supabase-repository.ts` — same `PlatformRepository` the local and
  Dynamo adapters implement
- `lib/supabase/auth.ts` — sign-up, sign-in, and admin confirm after an SMTP code
- Verification and password-reset codes are minted by the app and emailed
  through Gmail SMTP (`nidaasghar8750@gmail.com`). Supabase Auth mailer
  and confirmation links are not used. Turn **Confirm email** off under
  Authentication → Providers → Email so Supabase does not send its own mail.
- `lib/supabase/storage.ts` — signed upload and download URLs

Authorization stays in the Route Handlers. The service role is used only after
those checks.

## Still blocked

Live Auth, Postgres, and Storage stay off until these are set to real values:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- the password in `DATABASE_URL`
