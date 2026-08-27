-- Repair FTE Auth identities created before the provisioning trigger was
-- installed (or while their allowlist row was missing). Safe to rerun.
insert into public.profiles (id, name, role, email, ops_id, is_active, must_change_password)
select u.id, i.name, i.role, lower(u.email), i.ops_id, true, false
from auth.users u
join public.user_imports i on lower(i.email) = lower(u.email)
where u.email is not null
  and i.is_active
  and i.role in ('fte_ops', 'fte_mm')
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  email = excluded.email,
  ops_id = excluded.ops_id,
  is_active = true,
  updated_at = now();

update public.user_imports i
set auth_user_id = u.id, imported_at = now()
from auth.users u
where i.email is not null
  and lower(i.email) = lower(u.email)
  and i.is_active
  and i.role in ('fte_ops', 'fte_mm')
  and i.auth_user_id is distinct from u.id;
