alter table public.profiles drop constraint if exists profiles_check;
alter table public.profiles drop constraint if exists profiles_identity_check;
alter table public.profiles add constraint profiles_identity_check check (
  (role in ('ops_pic','doc_officer','dock_officer') and ops_id is not null) or email is not null
);

drop policy if exists "role-scoped request reads" on public.requests;
create policy "role-scoped request reads" on public.requests for select using (
  created_by = auth.uid() or public.current_role() in ('fte_ops','fte_mm','doc_officer','dock_officer')
);

drop policy if exists "role-scoped event reads" on public.request_events;
create policy "role-scoped event reads" on public.request_events for select using (
  exists (select 1 from public.requests r where r.id = request_id and
    (r.created_by = auth.uid() or public.current_role() in ('fte_ops','fte_mm','doc_officer','dock_officer')))
);
