create or replace function public.sync_cluster_backlogs_to_requests()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.requests
  set backlogs = new.backlogs,
      backlogs_timestamp = new.backlogs_ts,
      updated_at = now()
  where cluster = new.cluster_name
    and (
      backlogs is distinct from new.backlogs
      or backlogs_timestamp is distinct from new.backlogs_ts
    );

  return new;
end;
$$;

drop trigger if exists sync_cluster_backlogs_to_requests on public.clusters;

create trigger sync_cluster_backlogs_to_requests
after insert or update of cluster_name, backlogs, backlogs_ts on public.clusters
for each row execute function public.sync_cluster_backlogs_to_requests();
