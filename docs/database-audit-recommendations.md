# Database Audit & Recommendations — Supabase/PostgreSQL

> **Status (2026-09-19):** This is a historical audit record. Findings about Edge Function JWT/shared-secret enforcement and unrestricted intraday reads were remediated by `015_fix_intraday_dispatch_rls.sql`, `019_identity_and_audit_hardening.sql`, `supabase/config.toml`, and the current function handlers. Re-evaluate any remaining recommendation against the current migrations and source before implementing it.

**Scope:** `supabase/migrations/001` through `014`, `supabase/config.toml`, `supabase/functions/sync-clusters`, `supabase/functions/sync-intraday`.
**Date:** 2026-09-15

This document lists concrete findings from a schema/RLS/index/Edge-Function review, ordered by priority, with the intent of preventing recurring classes of errors (mislabeled migrations, permissive RLS, fail-open auth, non-idempotent migrations).

---

## P0 — Security

### 1. `sync-clusters` and `sync-intraday` Edge Functions are writable by anon-key holders
- `sync-clusters/index.ts` uses a service-role client but only checks HTTP method + payload shape — no caller-role check. `config.toml` sets `verify_jwt = true`, which accepts **any** valid Supabase JWT, including the public anon key. Anyone with the anon key (meant to be embedded in frontend code) can upsert arbitrary rows into `public.clusters`, bypassing the DB-level write restriction described in the `001_initial_schema.sql` RLS comments.
- `sync-intraday/index.ts` relies on a shared secret header (`x-sync-secret`) instead of `verify_jwt`, but:
  - `supabase/config.toml` has **no `[functions.sync-intraday]` block**, so it inherits the platform default `verify_jwt = true` — a caller without a Supabase JWT gets rejected before the function's own secret check even runs (an easy-to-miss deploy gap).
  - The secret check (`if (expectedSecret && ...)`) is **fail-open**: if `INTRADAY_SYNC_SECRET` is unset/empty in an environment, the check is skipped entirely and the endpoint accepts unauthenticated writes via the embedded service-role client.

**Recommendation:**
- Add an explicit `[functions.sync-intraday]` section to `config.toml` and decide deliberately whether `verify_jwt` should be true/false there.
- In both functions, add an explicit caller-role/service check inside the handler (don't rely solely on `verify_jwt`), and make the shared-secret check fail-closed (reject if the env var is missing, not just if it mismatches).
- Treat "service-role key lives only server-side" as necessary but not sufficient — the function's own authorization logic is the actual gate once verify_jwt only proves *authentication*, not *authorization* (see [CLAUDE.md](../CLAUDE.md) §9).

### 2. `intraday_dispatch` RLS policy is `using (true)` for all authenticated users
- Every other table in the schema gates SELECT through `current_role()` or row ownership. `intraday_dispatch`'s policy (`010_intraday_dispatch.sql`) has no such predicate — any authenticated user, regardless of role, can read all dispatch volume data.

**Recommendation:** Scope the policy to the roles that should see dispatch data (e.g. `fte_ops`, `fte_mm`), matching the pattern used for `clusters`/`requests`/`user_events`.

---

## P1 — Migration Correctness

### 3. `013_remove_dock_officer_role.sql` does not remove the `doc_officer` role — it's a no-op duplicate of 009
- Its body is byte-for-byte the same `profiles_identity_check` constraint as `009_docking_role_policies.sql`, and still includes `doc_officer`.
- It does not touch the `user_role` enum, does not touch the `requests`/`request_events` RLS policies (which still grant `doc_officer` full read access), and does not migrate/deactivate any existing `doc_officer` profiles.
- `doc_officer`/`dock_officer` is still referenced live throughout the frontend (`UserManagement.tsx`, `Dashboard.tsx`, `AppHeader.tsx`, `AppSidebar.tsx`, `RequestTable.tsx`, `DockingConfirmation.tsx`, `useQueueNotifications.ts`, `types.ts`) and backend (`UserController.php`, `AuthenticateSupabase.php`, `RequestAuthorizer.php`, `RequestService.php`, `RequestWorkflowTest.php`).

**Recommendation:** If role removal is still intended, treat 013 as unfinished and write a real migration (enum values can't be dropped directly in Postgres — requires rebuilding the type or migrating to a lookup table) plus corresponding RLS/policy/frontend/backend changes. If removal is no longer intended, rename/document 013 so its filename doesn't misstate what happened — mislabeled migrations make future audits (like this one) waste time re-deriving the real history.

### 4. `008_docking_role_support.sql` is a no-op — `doc_officer` was already in the enum from `001`
- `001_initial_schema.sql` defines `user_role` as `('ops_pic','fte_ops','fte_mm','doc_officer')` already. `008`'s `ALTER TYPE ... ADD VALUE IF NOT EXISTS 'doc_officer'` therefore does nothing. This suggests `001` in the repo doesn't reflect the literal historical order actually applied to production — worth confirming with whoever has production migration history, since migration files are otherwise assumed to document real history.

**Recommendation:** No action needed against production, but note this discrepancy so future schema archaeology isn't misled by the file order.

### 5. Migrations `001` and `007` are not safely re-runnable
- `001_initial_schema.sql`: `CREATE TYPE` (x4), `CREATE TABLE` (x5), `CREATE INDEX` (x5), and `CREATE POLICY` (x6) all lack existence guards. Replaying it outside normal Supabase migration tracking (e.g. rebuilding a fresh DB manually, or a tool that doesn't use `supabase_migrations.schema_migrations`) will error.
- `007_user_audit_events.sql`: table/index are guarded with `IF NOT EXISTS`, but `create policy "fte read user events"` has no preceding `DROP POLICY IF EXISTS`, unlike 009/010/013 which do this correctly.

**Recommendation:** Adopt the drop-then-create pattern for policies (`DROP POLICY IF EXISTS ... ; CREATE POLICY ...`) consistently, as already done in 009/010/013. Not urgent to touch `001` itself (never re-run in practice), but codify the pattern going forward — see the [CLAUDE.md](../CLAUDE.md) §7 rule "make it idempotent where appropriate."

### 6. `014_activate_all_clusters.sql` is an unguarded blanket UPDATE
- `update public.clusters set active = true where active is distinct from true;` — no business predicate beyond "not already true." This permanently overwrites any prior manual deactivation (closed hub, bad import, decommissioned dock) with no audit trail (`clusters` isn't covered by any audit table) and no reversibility.

**Recommendation:** Treat this as a one-time operational fix, not a pattern to repeat. Future data-repair migrations should scope `UPDATE`/`DELETE` to the specific condition being fixed (as `005_repair_existing_fte_profiles.sql` correctly does via its `auth.users` join and `IS DISTINCT FROM` guard), not a table-wide reset.

### 7. Duplicate `003` migration prefix and a skipped `012`
- Both `003_auth_flows.sql` and `003_cluster_name_upsert_key.sql` exist and apply, ordered only by alphabetical luck (`a` < `c`). `012` is genuinely missing (not renamed) between `011` and `013`.

**Recommendation:** Not urgent to renumber existing applied migrations (renumbering already-applied files risks tooling confusion), but going forward, check the highest existing prefix before creating a new migration file to avoid another collision, and don't backfill `012` — leave the gap documented here rather than reusing the number.

---

## P2 — Schema Hygiene / Performance

### 8. Inconsistent cascade behavior on `user_events`, an audit table
- `user_events.user_id → profiles(id) ON DELETE CASCADE` deletes a user's own audit history when their profile is deleted — defeating the purpose of an audit log.
- `user_events.actor_id → profiles(id)` has no `ON DELETE` clause (defaults to restrict), so deleting an *actor's* profile is blocked while deleting the *subject's* profile silently destroys history. The two FK columns on the same table have inconsistent, seemingly unintentional cascade policies.

**Recommendation:** Change `user_id`'s FK to `ON DELETE SET NULL` (or introduce soft-delete on `profiles` instead of hard delete) so audit rows survive profile deletion, matching audit-log expectations. Requires a new migration — do not edit `007` in place per [CLAUDE.md](../CLAUDE.md) §7 ("never edit an existing migration").

### 9. Redundant/overlapping indexes
- `clusters` still carries the original `UNIQUE(cluster_name, hub_name, dock_number)` table constraint from `001` even though `003_cluster_name_upsert_key.sql` added a stricter `UNIQUE(cluster_name)` that subsumes it — dead weight maintained on every write.
- `requests` has 6 secondary indexes accumulated across `001`, `006`, `011`; `requests_status_idx (status)` (from `006`) is subsumed by the existing composite `requests_status_created_idx (status, created_at desc)` and `requests_status_request_timestamp_idx` — likely safe to drop.
- `intraday_dispatch_date_hour_idx (dispatch_date, hour)` (from `010`) duplicates the implicit unique index already created by `UNIQUE(dispatch_date, hour)` on the same table/columns.

**Recommendation:** Before adding a new index, check for existing indexes with the same or a superset leading-column set (`\d+ table_name` or `pg_indexes`). Consider a follow-up migration to drop the confirmed-redundant ones (`clusters`' old composite unique constraint, `requests_status_idx`, `intraday_dispatch_date_hour_idx`) after confirming no code path relies on their specific index *name* (e.g. for `ON CONFLICT ON CONSTRAINT`).

### 10. Missing index on `requests.cluster_id`
- `requests.cluster_id` is a FK to `clusters.id` with no dedicated index. Lookups/joins by cluster (e.g. "requests for this cluster") and FK-check scans triggered by updates/deletes on `clusters` have no supporting index.

**Recommendation:** Add `CREATE INDEX IF NOT EXISTS requests_cluster_id_idx ON public.requests (cluster_id);` in a new migration if cluster-scoped queries exist or are planned in the app/reporting layer.

### 11. Fragile constraint-name assumption in `009`/`013`
- `alter table public.profiles drop constraint if exists profiles_check;` assumes Postgres's default auto-generated name for the original unnamed CHECK constraint from `001`. This is implicit and would silently no-op (not error, due to `IF EXISTS`) if the assumption ever breaks, potentially leaving two overlapping check constraints active.

**Recommendation:** Name constraints explicitly at creation time going forward (`CONSTRAINT profiles_identity_check CHECK (...)`) rather than relying on Postgres's auto-naming, so future `ALTER ... DROP CONSTRAINT` statements are unambiguous.

---

## Process Recommendations (to prevent recurrence)

1. **Migration filename must match migration body.** Before merging a migration, confirm the filename's claimed action (e.g. "remove X role") is actually what the SQL does. `013`'s mismatch is the clearest example of this failing.
2. **Check the highest existing migration number before creating a new file** to avoid prefix collisions like the two `003_*.sql` files, and don't reuse skipped numbers (`012`) to keep history unambiguous.
3. **Any migration enabling RLS on a new table must add a policy consistent with the existing role-scoping pattern**, or explicitly document why `using (true)` / deny-all is intentional (as `user_imports` correctly does implicitly, but `intraday_dispatch` does not).
4. **Any Edge Function using a service-role client must perform its own authorization check inside the handler.** `verify_jwt = true` only proves authentication (any valid JWT, including anon), never authorization — this is called out explicitly in [CLAUDE.md](../CLAUDE.md) §9 and was violated by both `sync-clusters` and `sync-intraday`.
5. **Secret/token comparisons must fail closed.** `if (secretEnvVar && header !== secretEnvVar)` fails open when the env var is unset — invert the check so a missing secret rejects the request rather than skipping validation.
6. **Blanket `UPDATE`/`DELETE` migrations need a business-condition predicate, not just an idempotency guard.** `IS DISTINCT FROM true` prevents redundant writes but does not prevent the migration from being a destructive one-time reset with no rollback path — scope the `WHERE` clause to the actual condition being repaired, as `005` does.
7. **New indexes require a check against existing indexes on the same table** for overlapping leading columns before being added, to avoid the write-amplification/redundancy accumulated on `requests` and `clusters`.
