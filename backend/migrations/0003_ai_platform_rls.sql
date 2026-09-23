-- Phase 2: RLS for AI platform tables.
-- Relies on public.is_admin() from frontend migration 0001 when present.
-- Recreates the helper if missing so this file can stand alone.

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

-- Ownership helpers ---------------------------------------------------------

create or replace function public.owns_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = p_conversation_id
      and c.user_id = auth.uid()
  );
$$;

revoke all on function public.owns_conversation(uuid) from public;
grant execute on function public.owns_conversation(uuid) to authenticated;

create or replace function public.owns_knowledge_base(p_kb_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.knowledge_bases kb
    where kb.id = p_kb_id
      and kb.owner_id = auth.uid()
  );
$$;

revoke all on function public.owns_knowledge_base(uuid) from public;
grant execute on function public.owns_knowledge_base(uuid) to authenticated;

create or replace function public.owns_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.documents d
    join public.knowledge_bases kb on kb.id = d.knowledge_base_id
    where d.id = p_document_id
      and kb.owner_id = auth.uid()
  );
$$;

revoke all on function public.owns_document(uuid) from public;
grant execute on function public.owns_document(uuid) to authenticated;

-- Enable RLS ----------------------------------------------------------------

alter table public.agents enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.agent_runs enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.knowledge_bases enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;

-- Ensure portfolio RLS remains on if tables were created by this package
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Agents: authenticated users read active agents; admins manage all --------

drop policy if exists "Users read active agents" on public.agents;
create policy "Users read active agents"
  on public.agents for select
  to authenticated
  using (status = 'active' or public.is_admin() or created_by = auth.uid());

drop policy if exists "Admins manage agents" on public.agents;
create policy "Admins manage agents"
  on public.agents for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Conversations -------------------------------------------------------------

drop policy if exists "Users own conversations select" on public.conversations;
create policy "Users own conversations select"
  on public.conversations for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users own conversations insert" on public.conversations;
create policy "Users own conversations insert"
  on public.conversations for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users own conversations update" on public.conversations;
create policy "Users own conversations update"
  on public.conversations for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users own conversations delete" on public.conversations;
create policy "Users own conversations delete"
  on public.conversations for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Messages ------------------------------------------------------------------

drop policy if exists "Users read own messages" on public.messages;
create policy "Users read own messages"
  on public.messages for select
  to authenticated
  using (public.owns_conversation(conversation_id) or public.is_admin());

drop policy if exists "Users insert own messages" on public.messages;
create policy "Users insert own messages"
  on public.messages for insert
  to authenticated
  with check (public.owns_conversation(conversation_id) or public.is_admin());

drop policy if exists "Users delete own messages" on public.messages;
create policy "Users delete own messages"
  on public.messages for delete
  to authenticated
  using (public.owns_conversation(conversation_id) or public.is_admin());

-- Agent runs ----------------------------------------------------------------

drop policy if exists "Users read own agent runs" on public.agent_runs;
create policy "Users read own agent runs"
  on public.agent_runs for select
  to authenticated
  using (
    public.is_admin()
    or (
      conversation_id is not null
      and public.owns_conversation(conversation_id)
    )
  );

drop policy if exists "Users insert own agent runs" on public.agent_runs;
create policy "Users insert own agent runs"
  on public.agent_runs for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      conversation_id is not null
      and public.owns_conversation(conversation_id)
    )
  );

drop policy if exists "Users update own agent runs" on public.agent_runs;
create policy "Users update own agent runs"
  on public.agent_runs for update
  to authenticated
  using (
    public.is_admin()
    or (
      conversation_id is not null
      and public.owns_conversation(conversation_id)
    )
  )
  with check (
    public.is_admin()
    or (
      conversation_id is not null
      and public.owns_conversation(conversation_id)
    )
  );

-- Workflows: catalog readable when active; admins manage --------------------

drop policy if exists "Users read active workflows" on public.workflows;
create policy "Users read active workflows"
  on public.workflows for select
  to authenticated
  using (status = 'active' or public.is_admin());

drop policy if exists "Admins manage workflows" on public.workflows;
create policy "Admins manage workflows"
  on public.workflows for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Workflow runs -------------------------------------------------------------

drop policy if exists "Users own workflow runs select" on public.workflow_runs;
create policy "Users own workflow runs select"
  on public.workflow_runs for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users own workflow runs insert" on public.workflow_runs;
create policy "Users own workflow runs insert"
  on public.workflow_runs for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users own workflow runs update" on public.workflow_runs;
create policy "Users own workflow runs update"
  on public.workflow_runs for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Knowledge bases -----------------------------------------------------------

drop policy if exists "Users own knowledge bases select" on public.knowledge_bases;
create policy "Users own knowledge bases select"
  on public.knowledge_bases for select
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "Users own knowledge bases insert" on public.knowledge_bases;
create policy "Users own knowledge bases insert"
  on public.knowledge_bases for insert
  to authenticated
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "Users own knowledge bases update" on public.knowledge_bases;
create policy "Users own knowledge bases update"
  on public.knowledge_bases for update
  to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "Users own knowledge bases delete" on public.knowledge_bases;
create policy "Users own knowledge bases delete"
  on public.knowledge_bases for delete
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- Documents -----------------------------------------------------------------

drop policy if exists "Users own documents select" on public.documents;
create policy "Users own documents select"
  on public.documents for select
  to authenticated
  using (public.owns_knowledge_base(knowledge_base_id) or public.is_admin());

drop policy if exists "Users own documents insert" on public.documents;
create policy "Users own documents insert"
  on public.documents for insert
  to authenticated
  with check (public.owns_knowledge_base(knowledge_base_id) or public.is_admin());

drop policy if exists "Users own documents update" on public.documents;
create policy "Users own documents update"
  on public.documents for update
  to authenticated
  using (public.owns_knowledge_base(knowledge_base_id) or public.is_admin())
  with check (public.owns_knowledge_base(knowledge_base_id) or public.is_admin());

drop policy if exists "Users own documents delete" on public.documents;
create policy "Users own documents delete"
  on public.documents for delete
  to authenticated
  using (public.owns_knowledge_base(knowledge_base_id) or public.is_admin());

-- Document chunks -----------------------------------------------------------

drop policy if exists "Users own chunks select" on public.document_chunks;
create policy "Users own chunks select"
  on public.document_chunks for select
  to authenticated
  using (public.owns_document(document_id) or public.is_admin());

drop policy if exists "Users own chunks insert" on public.document_chunks;
create policy "Users own chunks insert"
  on public.document_chunks for insert
  to authenticated
  with check (public.owns_document(document_id) or public.is_admin());

drop policy if exists "Users own chunks delete" on public.document_chunks;
create policy "Users own chunks delete"
  on public.document_chunks for delete
  to authenticated
  using (public.owns_document(document_id) or public.is_admin());

-- Knowledge storage: path knowledge/{user_id}/... ---------------------------

drop policy if exists "Users manage own knowledge files" on storage.objects;
create policy "Users manage own knowledge files"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'knowledge'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'knowledge'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Admins manage knowledge files" on storage.objects;
create policy "Admins manage knowledge files"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'knowledge' and public.is_admin())
  with check (bucket_id = 'knowledge' and public.is_admin());
