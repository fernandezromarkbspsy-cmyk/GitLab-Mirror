-- Standardize the profile identity constraint name and make the user-events
-- policy recreation safely idempotent for future reruns.

alter table public.profiles drop constraint if exists profiles_check;
alter table public.profiles drop constraint if exists profiles_identity_check;
alter table public.profiles
  add constraint profiles_identity_check check (
    (role in ('ops_pic','fte_ops','fte_mm','doc_officer') and ops_id is not null) or email is not null
  );

drop policy if exists "fte read user events" on public.user_events;
create policy "fte read user events"
  on public.user_events
  for select
  using (public.current_role() in ('fte_ops','fte_mm'));
