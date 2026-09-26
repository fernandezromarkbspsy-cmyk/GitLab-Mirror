create table if not exists public.user_imports (
  id uuid primary key default gen_random_uuid(),
  source_id text not null unique,
  name text not null,
  role public.user_role not null,
  email text unique,
  ops_id text unique,
  is_active boolean not null default true,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  imported_at timestamptz not null default now(),
  check (email is not null or ops_id is not null)
);

alter table public.user_imports enable row level security;