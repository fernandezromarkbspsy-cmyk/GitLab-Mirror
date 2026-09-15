-- P2 schema hygiene: preserve audit history, remove redundant indexes, and add
-- the missing cluster lookup index without changing the live role model.

alter table public.user_events
  alter column user_id drop not null;

alter table public.user_events
  drop constraint if exists user_events_user_id_fkey;

alter table public.user_events
  add constraint user_events_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;

drop index if exists public.clusters_cluster_name_hub_name_dock_number_key;
drop index if exists public.requests_status_idx;
drop index if exists public.intraday_dispatch_date_hour_idx;

create index if not exists requests_cluster_id_idx
  on public.requests (cluster_id);
