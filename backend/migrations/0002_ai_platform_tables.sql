-- Phase 2: AI platform tables + additive columns.
-- Compatible with frontend/supabase/migrations/0001_init.sql.
-- Does NOT invent seed rows. Empty tables return 0 / [].

-- ---------------------------------------------------------------------------
-- Helpers (idempotent with frontend migration)
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

-- ---------------------------------------------------------------------------
-- Ensure portfolio tables exist (same shape as frontend; no-op if already present)
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

-- Additive: notification metadata for agent/workflow events
alter table public.notifications
  add column if not exists metadata jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- Agents
-- ---------------------------------------------------------------------------

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  system_prompt text not null default '',
  agent_type text not null
    check (agent_type in (
      'supervisor', 'research', 'rag', 'automation', 'support', 'custom'
    )),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  configuration jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agents_status_idx on public.agents (status);
create index if not exists agents_type_idx on public.agents (agent_type);
create index if not exists agents_created_by_idx on public.agents (created_by);

-- ---------------------------------------------------------------------------
-- Conversations / messages / agent runs
-- ---------------------------------------------------------------------------

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  agent_id uuid references public.agents (id) on delete set null,
  title text not null default 'New conversation',
  status text not null default 'active'
    check (status in ('active', 'archived', 'closed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_id_idx
  on public.conversations (user_id, created_at desc);
create index if not exists conversations_agent_id_idx
  on public.conversations (agent_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL')),
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  token_usage jsonb,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx
  on public.messages (conversation_id, created_at);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations (id) on delete set null,
  agent_id uuid references public.agents (id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'succeeded', 'failed', 'cancelled')),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  execution_time_ms integer,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists agent_runs_conversation_id_idx
  on public.agent_runs (conversation_id, created_at desc);
create index if not exists agent_runs_agent_id_idx
  on public.agent_runs (agent_id, created_at desc);
create index if not exists agent_runs_status_idx
  on public.agent_runs (status);

-- ---------------------------------------------------------------------------
-- Workflows / runs (n8n)
-- ---------------------------------------------------------------------------

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  workflow_type text not null
    check (workflow_type in (
      'leadflow', 'mailpilot', 'invoiceflow', 'supportsync', 'contentflow', 'custom'
    )),
  n8n_workflow_id text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'archived')),
  configuration jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workflows_type_idx on public.workflows (workflow_type);
create index if not exists workflows_status_idx on public.workflows (status);

create table if not exists public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'succeeded', 'failed', 'cancelled')),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error text,
  idempotency_key text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists workflow_runs_workflow_id_idx
  on public.workflow_runs (workflow_id, started_at desc);
create index if not exists workflow_runs_user_id_idx
  on public.workflow_runs (user_id, started_at desc);
create index if not exists workflow_runs_status_idx
  on public.workflow_runs (status);
create unique index if not exists workflow_runs_idempotency_uidx
  on public.workflow_runs (user_id, idempotency_key)
  where idempotency_key is not null;

-- ---------------------------------------------------------------------------
-- Knowledge / RAG (pgvector)
-- ---------------------------------------------------------------------------

create table if not exists public.knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  owner_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists knowledge_bases_owner_id_idx
  on public.knowledge_bases (owner_id, created_at desc);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  knowledge_base_id uuid not null
    references public.knowledge_bases (id) on delete cascade,
  name text not null,
  storage_path text not null,
  mime_type text,
  file_size bigint,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'ready', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_knowledge_base_id_idx
  on public.documents (knowledge_base_id, created_at desc);
create index if not exists documents_status_idx on public.documents (status);

-- Default embedding size: 1536 (OpenAI text-embedding-3-small / ada-002).
-- Change only with a deliberate migration if the LLM provider differs.
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  content text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists document_chunks_document_id_idx
  on public.document_chunks (document_id);

-- IVFFlat requires rows before build; use HNSW for empty-friendly indexing.
create index if not exists document_chunks_embedding_hnsw_idx
  on public.document_chunks
  using hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

drop trigger if exists agents_set_updated_at on public.agents;
create trigger agents_set_updated_at
  before update on public.agents
  for each row execute function public.set_updated_at();

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

drop trigger if exists workflows_set_updated_at on public.workflows;
create trigger workflows_set_updated_at
  before update on public.workflows
  for each row execute function public.set_updated_at();

drop trigger if exists knowledge_bases_set_updated_at on public.knowledge_bases;
create trigger knowledge_bases_set_updated_at
  before update on public.knowledge_bases
  for each row execute function public.set_updated_at();

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage bucket for RAG documents (private)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'knowledge',
  'knowledge',
  false,
  20971520,
  array[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
