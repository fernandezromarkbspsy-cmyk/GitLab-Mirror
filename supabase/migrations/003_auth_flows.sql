alter table public.profiles
  add column if not exists must_change_password boolean not null default false,
  add column if not exists password_changed_at timestamptz;

update public.profiles set must_change_password = true
where role = 'ops_pic' and password_changed_at is null;

create index if not exists profiles_ops_id_lower_idx
  on public.profiles (lower(ops_id)) where ops_id is not null;

-- FTE identities are allowlisted by the import before their first OTP request.
-- Keeping this table in the migration lets Auth safely provision a staged FTE
-- on first login without allowing arbitrary @spxexpress.com accounts access.
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

create or replace function public.provision_staged_fte()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  staged public.user_imports%rowtype;
begin
  if new.email is null or lower(new.email) not like '%@spxexpress.com' then
    return new;
  end if;

  select * into staged
  from public.user_imports
  where lower(email) = lower(new.email)
    and is_active
    and role in ('fte_ops', 'fte_mm')
  limit 1;

  if staged.id is null then
    raise exception 'FTE email is not provisioned for SOC 5 Outbound';
  end if;

  insert into public.profiles (id, name, role, email, ops_id, is_active, must_change_password)
  values (new.id, staged.name, staged.role, lower(new.email), staged.ops_id, true, false)
  on conflict (id) do update set
    name = excluded.name,
    role = excluded.role,
    email = excluded.email,
    is_active = true,
    updated_at = now();

  update public.user_imports set auth_user_id = new.id, imported_at = now()
  where id = staged.id;
  return new;
end;
$$;

drop trigger if exists provision_staged_fte_after_auth_insert on auth.users;
create trigger provision_staged_fte_after_auth_insert
after insert on auth.users
for each row execute function public.provision_staged_fte();
