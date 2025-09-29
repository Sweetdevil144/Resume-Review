create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('user','admin');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'submission_status') then
    -- Keep statuses aligned with PS: Approved / Needs Revision / Rejected
    create type public.submission_status as enum ('pending','approved','needs_revision','rejected');
  end if;
end $$;

-- Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  file_url text not null,
  original_name text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  status public.submission_status not null default 'pending',
  score numeric,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_submissions_user on public.submissions (user_id);
create index if not exists idx_submissions_status on public.submissions (status);
create index if not exists idx_submissions_created_at on public.submissions (created_at desc);

-- =====================================
-- Row Level Security (RLS)
-- =====================================
alter table public.profiles enable row level security;
alter table public.submissions enable row level security;

create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return false;
  end if;
  return exists (
    select 1 from public.profiles p where p.id = uid and p.role = 'admin'
  );
end;
$$;

-- profiles policies (user can read self; admin can update)
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert
  with check (id = auth.uid());

-- submissions policies
-- Owner: can insert and read their own rows
-- Admin: can read/update all rows
drop policy if exists submissions_owner_select on public.submissions;
create policy submissions_owner_select on public.submissions for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists submissions_owner_insert on public.submissions;
create policy submissions_owner_insert on public.submissions for insert
  with check (user_id = auth.uid());

drop policy if exists submissions_admin_update on public.submissions;
create policy submissions_admin_update on public.submissions for update
  using (public.is_admin());

drop policy if exists submissions_owner_delete on public.submissions;
create policy submissions_owner_delete on public.submissions for delete
  using (user_id = auth.uid() or public.is_admin());

-- =====================================
-- Triggers (timestamps only)
-- =====================================
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_submissions_set_updated_at on public.submissions;
create trigger trg_submissions_set_updated_at
  before update on public.submissions
  for each row execute function public.set_updated_at();

-- Note: No storage policies, background jobs, audit/event tables, or extra triggers.
-- Keep storage access via signed URLs from the application layer.


