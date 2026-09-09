-- Keep deployed profile constraints aligned with the supported role set.
alter table public.profiles drop constraint if exists profiles_identity_check;
alter table public.profiles add constraint profiles_identity_check check (
  (role in ('ops_pic','doc_officer') and ops_id is not null) or email is not null
);
