alter table public.profiles
  add column if not exists last_seen_at timestamptz;

create index if not exists profiles_presence_eligibility_idx
  on public.profiles (role, is_active, last_seen_at);

create table if not exists public.approval_routing_cursors (
  scope text primary key,
  cursor_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists approval_routing_cursors_updated_at on public.approval_routing_cursors;
create trigger approval_routing_cursors_updated_at
before update on public.approval_routing_cursors
for each row execute function public.set_updated_at();
