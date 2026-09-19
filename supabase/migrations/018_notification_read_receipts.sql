create table if not exists public.notification_reads (
  notification_id bigint not null references public.notifications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

create index if not exists notification_reads_user_read_idx
  on public.notification_reads (user_id, read_at);

alter table public.notification_reads enable row level security;

drop policy if exists "own notification receipts" on public.notification_reads;
create policy "own notification receipts"
  on public.notification_reads
  for select
  using (user_id = auth.uid());

-- Preserve the old shared read state for users who currently belong to the
-- target role. New acknowledgements are recorded per user by Laravel.
insert into public.notification_reads (notification_id, user_id, read_at)
select n.id, p.id, n.read_at
from public.notifications n
join public.profiles p on p.role = n.target_role and p.is_active
where n.target_role is not null
  and n.read_at is not null
on conflict (notification_id, user_id) do nothing;
