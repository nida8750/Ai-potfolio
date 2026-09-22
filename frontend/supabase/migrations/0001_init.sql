-- Nida AI / project ref wpdslwonqowelbrublju
-- Apply in the Supabase SQL editor or with the CLI against this project.
-- Service role bypasses RLS. Anon and authenticated roles are constrained below.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'
      and status = 'active'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  phone text,
  role text not null default 'USER' check (role in ('USER', 'ADMIN')),
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'disabled')),
  cognito_sub text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  short_description text not null default '',
  technologies text[] not null default '{}',
  price numeric(12, 2),
  currency text not null default 'USD',
  pricing_type text not null default 'custom'
    check (pricing_type in ('fixed', 'starting_from', 'custom')),
  icon text not null default 'agents',
  is_active boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null,
  description text not null,
  technologies text[] not null default '{}',
  image text,
  image_key text,
  github_url text,
  live_url text,
  featured boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  service_id uuid references public.services (id) on delete set null,
  subject text,
  message text not null,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'completed', 'closed')),
  source text not null check (source in ('contact', 'service_request')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id),
  customer_email text not null,
  customer_name text not null,
  amount numeric(12, 2) not null,
  currency text not null,
  payment_provider text check (payment_provider in ('stripe', 'paypal')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled')),
  order_status text not null default 'pending'
    check (order_status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  provider_order_id text,
  provider_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists orders_provider_order_id_uidx
  on public.orders (payment_provider, provider_order_id)
  where payment_provider is not null and provider_order_id is not null;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('stripe', 'paypal')),
  provider_payment_id text,
  provider_order_id text,
  amount numeric(12, 2) not null,
  currency text not null,
  status text not null
    check (status in ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled')),
  event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists payments_provider_event_uidx
  on public.payments (provider, event_id)
  where event_id is not null;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.processed_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe', 'paypal')),
  event_id text not null,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create table if not exists public.platform_settings (
  id text primary key default 'platform' check (id = 'platform'),
  default_currency text not null default 'USD',
  payment_provider text not null default 'none'
    check (payment_provider in ('stripe', 'paypal', 'none')),
  bookings_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

create index if not exists inquiries_user_id_idx on public.inquiries (user_id, created_at desc);
create index if not exists orders_user_id_idx on public.orders (user_id, created_at desc);
create index if not exists payments_user_id_idx on public.payments (user_id, created_at desc);
create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists inquiries_set_updated_at on public.inquiries;
create trigger inquiries_set_updated_at
  before update on public.inquiries
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if not public.is_admin() then
    new.role := old.role;
    new.status := old.status;
    new.email := old.email;
    new.id := old.id;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role text;
begin
  if exists (select 1 from public.profiles) then
    next_role := 'USER';
  else
    next_role := 'ADMIN';
  end if;

  insert into public.profiles (id, email, name, role, status)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, 'user'), '@', 1)),
    next_role,
    'active'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.projects enable row level security;
alter table public.inquiries enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.processed_events enable row level security;
alter table public.platform_settings enable row level security;

drop policy if exists "Public read published services" on public.services;
create policy "Public read published services"
  on public.services for select
  using (is_active = true or public.is_admin());

drop policy if exists "Admins manage services" on public.services;
create policy "Admins manage services"
  on public.services for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Public read published projects" on public.projects;
create policy "Public read published projects"
  on public.projects for select
  using (is_published = true or public.is_admin());

drop policy if exists "Admins manage projects" on public.projects;
create policy "Admins manage projects"
  on public.projects for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "Anyone can submit inquiries" on public.inquiries;
create policy "Anyone can submit inquiries"
  on public.inquiries for insert
  with check (true);

drop policy if exists "Users read own inquiries" on public.inquiries;
create policy "Users read own inquiries"
  on public.inquiries for select
  using (
    public.is_admin()
    or user_id = auth.uid()
    or email = (auth.jwt() ->> 'email')
  );

drop policy if exists "Admins update inquiries" on public.inquiries;
create policy "Admins update inquiries"
  on public.inquiries for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users own orders" on public.orders;
create policy "Users own orders"
  on public.orders for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users create own orders" on public.orders;
create policy "Users create own orders"
  on public.orders for insert
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users and admins update orders" on public.orders;
create policy "Users and admins update orders"
  on public.orders for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users read own payments" on public.payments;
create policy "Users read own payments"
  on public.payments for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Admins read audit logs" on public.audit_logs;
create policy "Admins read audit logs"
  on public.audit_logs for select
  using (public.is_admin());

drop policy if exists "Public read settings" on public.platform_settings;
create policy "Public read settings"
  on public.platform_settings for select
  using (true);

drop policy if exists "Admins update settings" on public.platform_settings;
create policy "Admins update settings"
  on public.platform_settings for update
  using (public.is_admin())
  with check (public.is_admin());

-- processed_events: no policies. Anon/authenticated cannot read or write.
-- Route Handlers use the service role after webhook signature checks.

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assets',
  'assets',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users manage own avatars" on storage.objects;
create policy "Users manage own avatars"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

drop policy if exists "Admins manage all assets" on storage.objects;
create policy "Admins manage all assets"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'assets' and public.is_admin())
  with check (bucket_id = 'assets' and public.is_admin());
