-- MoshBit core schema
-- Specs are markdown documents that humans and each user's own AI (via MCP) co-edit.
-- All access is gated by RLS: a Supabase-issued user token (the same token the MCP
-- server validates) only ever sees workspaces the user belongs to.

-- ---------------------------------------------------------------------------
-- workspaces
-- ---------------------------------------------------------------------------
create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- membership drives every RLS check below
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- owner is always a member
create or replace function public.add_owner_as_member()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end; $$;

create trigger trg_workspace_owner_member
  after insert on public.workspaces
  for each row execute function public.add_owner_as_member();

-- ---------------------------------------------------------------------------
-- documents (specs) — markdown is the source of truth
-- ---------------------------------------------------------------------------
create table public.documents (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title        text not null,
  slug         text not null,
  content      text not null default '',          -- full markdown
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, slug)
);

create index documents_workspace_idx on public.documents (workspace_id);

-- ---------------------------------------------------------------------------
-- versions — snapshot taken on create_version() (and ideally each AI write)
-- ---------------------------------------------------------------------------
create table public.document_versions (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.documents (id) on delete cascade,
  content      text not null,
  note         text,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index document_versions_doc_idx on public.document_versions (document_id, created_at desc);

-- ---------------------------------------------------------------------------
-- comments — the human <-> AI collaboration surface, anchored to a heading/range
-- ---------------------------------------------------------------------------
create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.documents (id) on delete cascade,
  anchor       text,                               -- e.g. a heading slug or line range
  body         text not null,
  author_kind  text not null default 'human' check (author_kind in ('human', 'ai')),
  author_id    uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index comments_doc_idx on public.comments (document_id, created_at);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_documents_touch
  before update on public.documents
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — membership is the single source of authority for every table
-- ---------------------------------------------------------------------------
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.documents         enable row level security;
alter table public.document_versions enable row level security;
alter table public.comments          enable row level security;

-- helper: is the current user a member of a workspace?
create or replace function public.is_member(ws uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
  );
$$;

-- workspaces: visible to members; creatable by the authenticated owner
create policy ws_select on public.workspaces
  for select using (public.is_member(id));
create policy ws_insert on public.workspaces
  for insert with check (owner_id = auth.uid());
create policy ws_update on public.workspaces
  for update using (owner_id = auth.uid());
create policy ws_delete on public.workspaces
  for delete using (owner_id = auth.uid());

-- members: visible within your own workspaces
create policy wm_select on public.workspace_members
  for select using (public.is_member(workspace_id));

-- documents: full read/write for members
create policy doc_select on public.documents
  for select using (public.is_member(workspace_id));
create policy doc_insert on public.documents
  for insert with check (public.is_member(workspace_id));
create policy doc_update on public.documents
  for update using (public.is_member(workspace_id));
create policy doc_delete on public.documents
  for delete using (public.is_member(workspace_id));

-- versions: read/insert for members of the parent document's workspace
create policy ver_select on public.document_versions
  for select using (exists (
    select 1 from public.documents d
    where d.id = document_id and public.is_member(d.workspace_id)));
create policy ver_insert on public.document_versions
  for insert with check (exists (
    select 1 from public.documents d
    where d.id = document_id and public.is_member(d.workspace_id)));

-- comments: read/insert for members of the parent document's workspace
create policy cmt_select on public.comments
  for select using (exists (
    select 1 from public.documents d
    where d.id = document_id and public.is_member(d.workspace_id)));
create policy cmt_insert on public.comments
  for insert with check (exists (
    select 1 from public.documents d
    where d.id = document_id and public.is_member(d.workspace_id)));
