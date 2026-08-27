# Outbound Reference Data Import

## Validation summary

- `cluster.csv`: 134 rows, no duplicate `hub_name` values.
- `user.csv`: 109 rows; 22 `fte_ops` and 87 `ops_pic`.
- No duplicate non-null user emails or OPS IDs.
- Three secondary hubs have no dock assignment: Rodriguez Hub 2, Maguyam Hub,
  and Inarawan Hub.

## SQL Editor seed files

The seed files have been adapted to the current Supabase schema:

- `clusters-seed.sql` stages legacy IDs temporarily and upserts clusters by
  `hub_name`, allowing PostgreSQL to generate valid UUIDs.
- `users-seed.sql` stores all source users in a private `user_imports` table and
  promotes only records that already have a matching Supabase Auth account.

## Import clusters

Run migrations in order:

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_cluster_import_compatibility.sql
```

Then execute `docs/outbound/clusters-seed.sql` in the SQL Editor.

After import, verify:

```sql
select count(*) as cluster_count from public.clusters;

select hub_name, count(*)
from public.clusters
group by hub_name
having count(*) > 1;

select cluster_name, hub_name, region
from public.clusters
where dock_number is null
order by hub_name;
```

Expected count is 134, the duplicate query should return no rows, and the missing
dock query should return three rows.

## Import users safely

Execute `docs/outbound/users-seed.sql` in the SQL Editor. It safely stages all 109
users. Supabase Auth must create each account before it can be promoted to
`profiles`, ensuring passwords remain managed by Supabase.

For FTE users, run the user seed before the first login. The first OTP request
creates the Supabase Auth identity only when the email is an active FTE entry in
`user_imports`; migration 003 then creates its matching profile automatically.

For manual provisioning:

1. Create or invite the user through Supabase Auth using their email.
2. Insert the matching profile by resolving that Auth email:

```sql
insert into public.profiles (id, name, role, email, is_active)
select id, 'User Name', 'fte_ops', email, true
from auth.users
where lower(email) = lower('user@spxexpress.com')
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  email = excluded.email,
  is_active = excluded.is_active,
  updated_at = now();
```

The 87 Ops PIC rows have OPS IDs but no email addresses. They cannot use the
current Supabase email/password login until a verified email or an approved
OPS-ID-to-authentication strategy is defined. Do not invent shared passwords or
store password hashes from the CSV.
