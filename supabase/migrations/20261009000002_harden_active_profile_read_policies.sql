-- Forward-only hardening. This keeps disabled profiles from retaining browser
-- reads or realtime visibility while preserving role/ownership semantics.
alter table public.profiles enable row level security;
alter table public.clusters enable row level security;
alter table public.requests enable row level security;
alter table public.request_events enable row level security;
alter table public.notifications enable row level security;
alter table public.user_events enable row level security;
alter table public.intraday_dispatch enable row level security;
alter table public.notification_reads enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own active profile" on public.profiles for select using (
  is_active and (id = auth.uid() or public.current_role() in ('fte_ops','fte_mm'))
);

drop policy if exists "authenticated read clusters" on public.clusters;
create policy "active users read clusters" on public.clusters for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active)
);

drop policy if exists "role-scoped request reads" on public.requests;
create policy "active role-scoped request reads" on public.requests for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active)
  and (created_by = auth.uid() or public.current_role() in ('fte_ops','fte_mm','doc_officer'))
);

drop policy if exists "role-scoped event reads" on public.request_events;
create policy "active role-scoped event reads" on public.request_events for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active)
  and exists (select 1 from public.requests r where r.id = request_id and
    (r.created_by = auth.uid() or public.current_role() in ('fte_ops','fte_mm','doc_officer')))
);

drop policy if exists "own notifications" on public.notifications;
create policy "active own notifications" on public.notifications for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active)
  and (user_id = auth.uid() or target_role = public.current_role())
);

drop policy if exists "fte read user events" on public.user_events;
create policy "active fte read user events" on public.user_events for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active)
  and public.current_role() in ('fte_ops','fte_mm')
);

drop policy if exists intraday_dispatch_authenticated_read on public.intraday_dispatch;
create policy intraday_dispatch_active_authenticated_read on public.intraday_dispatch
  for select to authenticated using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active)
    and public.current_role() in ('fte_ops', 'fte_mm')
  );

drop policy if exists "own notification receipts" on public.notification_reads;
create policy "own active notification receipts" on public.notification_reads
  for select using (
    user_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active)
  );
