alter table public.profiles
  add column if not exists password_reset_at timestamptz;

update public.profiles
set password_reset_at = coalesce(password_reset_at, created_at, now())
where must_change_password = true;

alter table public.user_events
  drop constraint if exists user_events_event_type_check;

alter table public.user_events
  add constraint user_events_event_type_check
  check (event_type in ('USER_CREATED', 'USER_UPDATED', 'USER_DISABLED', 'PASSWORD_RESET'));