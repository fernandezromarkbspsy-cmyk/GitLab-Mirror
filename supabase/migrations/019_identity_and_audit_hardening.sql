do $$
begin
  if exists (
    select lower(trim(ops_id))
    from public.profiles
    where ops_id is not null
    group by lower(trim(ops_id))
    having count(*) > 1
  ) then
    raise exception 'Duplicate case-insensitive Ops IDs exist in profiles; resolve them before applying migration 019.';
  end if;

  if exists (
    select lower(trim(ops_id))
    from public.user_imports
    where ops_id is not null
    group by lower(trim(ops_id))
    having count(*) > 1
  ) then
    raise exception 'Duplicate case-insensitive Ops IDs exist in user_imports; resolve them before applying migration 019.';
  end if;
end;
$$;

update public.profiles
set ops_id = lower(trim(ops_id))
where ops_id is not null;

update public.user_imports
set ops_id = lower(trim(ops_id))
where ops_id is not null;

create unique index concurrently if not exists profiles_ops_id_lower_unique
  on public.profiles (lower(trim(ops_id))) where ops_id is not null;

create unique index concurrently if not exists user_imports_ops_id_lower_unique
  on public.user_imports (lower(trim(ops_id))) where ops_id is not null;

alter table public.user_events drop constraint if exists user_events_event_type_check;
alter table public.user_events add constraint user_events_event_type_check
  check (event_type in ('USER_CREATED','USER_UPDATED','USER_DISABLED','PASSWORD_RESET'));
