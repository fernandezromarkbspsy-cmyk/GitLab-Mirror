-- Makes public.clusters compatible with docs/outbound/cluster.csv.
-- Safe to run after 001_initial_schema.sql.

alter table public.clusters
  add column if not exists active boolean not null default true,
  add column if not exists created_at timestamptz not null default now();

-- The source file contains three secondary hubs whose dock is not assigned yet.
alter table public.clusters alter column dock_number drop not null;
alter table public.clusters alter column backlogs drop not null;

-- hub_name is unique in the source and is the stable upsert/import key.
create unique index if not exists clusters_hub_name_uidx
  on public.clusters (hub_name);
create index if not exists clusters_region_active_idx
  on public.clusters (region, active);

-- Supabase CSV import sends blank active/created_at cells as null rather than
-- omitting them, so table defaults alone are insufficient.
create or replace function public.normalize_cluster_import_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.active := coalesce(new.active, true);
  new.created_at := coalesce(new.created_at, now());
  return new;
end;
$$;

drop trigger if exists clusters_import_defaults on public.clusters;
create trigger clusters_import_defaults
before insert or update on public.clusters
for each row execute function public.normalize_cluster_import_defaults();
