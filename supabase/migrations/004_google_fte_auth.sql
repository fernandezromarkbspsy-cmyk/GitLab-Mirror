-- Google OAuth is an FTE-only login method. The Google `hd` parameter used by
-- the frontend is only a UI hint; this trigger remains the authorization gate.
create or replace function public.provision_staged_fte()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  staged public.user_imports%rowtype;
  is_google boolean := coalesce(new.raw_app_meta_data ->> 'provider', '') = 'google'
    or coalesce(new.raw_app_meta_data -> 'providers', '[]'::jsonb) ? 'google';
  is_spx_email boolean := new.email is not null
    and lower(new.email) like '%@spxexpress.com';
begin
  if not is_google and not is_spx_email then
    return new;
  end if;

  select * into staged
  from public.user_imports
  where lower(email) = lower(new.email)
    and is_active
    and role in ('fte_ops', 'fte_mm')
  limit 1;

  if staged.id is null then
    raise exception 'FTE email is not provisioned for SOC 5 Outbound';
  end if;

  insert into public.profiles (id, name, role, email, ops_id, is_active, must_change_password)
  values (new.id, staged.name, staged.role, lower(new.email), staged.ops_id, true, false)
  on conflict (id) do update set
    name = excluded.name,
    role = excluded.role,
    email = excluded.email,
    is_active = true,
    updated_at = now();

  update public.user_imports set auth_user_id = new.id, imported_at = now()
  where id = staged.id;
  return new;
end;
$$;
