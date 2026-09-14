-- Cluster names are the stable identity supplied by the Google Sheet sync.
-- Remove the previous hub_name uniqueness assumption before adding the key.
drop index if exists public.clusters_hub_name_uidx;
create unique index if not exists clusters_cluster_name_uidx
  on public.clusters (cluster_name);