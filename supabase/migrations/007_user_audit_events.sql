create table if not exists public.user_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  event_type text not null check (event_type in ('USER_CREATED','USER_UPDATED','USER_DISABLED')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_events_user_created_idx on public.user_events(user_id, created_at desc);
alter table public.user_events enable row level security;
create policy "fte read user events" on public.user_events for select using (public.current_role() in ('fte_ops','fte_mm'));
