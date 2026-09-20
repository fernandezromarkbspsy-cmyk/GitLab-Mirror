# SOC5-Outbound Backend Analysis

Analyzed revision: current working tree with pending PR changes included  
Scope: Laravel API, Supabase schema/RLS/functions, deployment path, backend tests, and frontend callers that define API behavior.

Status (2026-09-20): Remediated findings include idempotency cleanup and client keys, dispatch authorization, business-timezone reporting, Edge Function body/configuration controls, Backroom provisioning state preservation, Supabase Admin request centralization, and deployment migration/scheduler checks. The historical findings below remain as review context only where the current source no longer matches them.

## Executive summary

The backend is a compact Laravel 12 modular monolith backed by Supabase PostgreSQL and Auth. Its basic shape is appropriate for the product: controllers validate HTTP input, the Requests feature separates authorization/service/repository concerns, workflow mutations use database transactions and row locks, and browser-side database writes are blocked by RLS.

The current implementation still has verified product and authorization risks: mandatory first-login completion needs stronger remote-password verification, request actions need stricter field ownership, role notifications have shared read state, and the request state machine documents transient `ASSIGNED` behavior differently from the committed result. Deployment, scheduler, idempotency headers/cleanup, business-timezone handling, normalized Ops ID uniqueness, centralized Supabase Admin handling, and bounded Edge Function controls are resolved in the current branch.

| Area | Assessment |
|---|---|
| Architecture | Sensible small modular monolith; uneven feature boundaries outside Requests |
| Authentication | Supabase validation and active-profile checks are sound; first-login completion still needs remote-password verification |
| Authorization | Role checks exist, but two important object/route gaps remain |
| Data integrity | Transactions and row locks are strong; generic action updates and non-atomic external sync weaken them |
| Database security | RLS blocks browser writes and scopes reads; Laravel can bypass policies and must mirror every rule |
| Reliability | Idempotency, scheduled work, and migration deployment checks are present; Google Sheets full-rewrite recovery remains an open concern |
| Scalability | Fine for current scale; offset pagination, aggregate scans, full-sheet rewrites, and file cache are limits |
| Test confidence | Useful feature tests, but SQLite hand-built schemas miss PostgreSQL, RLS, migration, and concurrency behavior |

## Actual architecture

```text
Browser
  ├─ Supabase Auth (OTP, Google OAuth, Backroom session storage)
  ├─ Supabase Realtime / direct SELECT under RLS
  └─ NGINX /api
       └─ Laravel API
            ├─ AuthenticateSupabase → Supabase /auth/v1/user + local profiles lookup
            ├─ Controllers / closures → validation and endpoint authorization
            ├─ RequestService → state transitions, events, notifications
            ├─ RequestRepository → PostgreSQL query builder
            ├─ Supabase Admin API → user create/reset/delete compensation
            └─ Google Sheets API → scheduled full-sheet mirror

Google Apps Script
  └─ shared-secret Supabase Edge Functions
       ├─ sync-clusters → clusters upsert with service role
       └─ sync-intraday → intraday_dispatch upsert with service role
```

The API exposes 26 routes plus `/up`. Three are public (`auth/status`, Backroom login, access request), two are authenticated auth routes, and the remainder cover users, notifications, clusters, KPI, intraday dispatch, and requests. The dynamic request-action route supports seven actions.

The Requests feature is the clearest boundary:

```text
RequestController
  ├─ RequestRepository ── query/scoping/pagination/analytics
  └─ RequestService
       ├─ RequestAuthorizer
       ├─ row lock + transaction
       ├─ request update
       ├─ request_events append
       └─ notifications append
```

Auth, Users, Notifications, KPI, and Dispatch put persistence and policy logic directly in controllers or route closures. This is acceptable at the current size, but it makes policy consistency harder; the dispatch authorization mismatch is an example.

## Actual request workflow

| Action | Required state | Role enforced | Committed result |
|---|---|---|---|
| create | new | Ops PIC or FTE Ops | `PENDING` |
| approve | `PENDING`, `REJECTED_BY_MM` | FTE Ops | `APPROVED` |
| reject-ops | `PENDING`, `REJECTED_BY_MM` | FTE Ops | `CANCELLED` |
| cancel | `PENDING`, `REJECTED_BY_MM` | owning Ops PIC | `CANCELLED` |
| reject-mm | `APPROVED` | FTE MM | `REJECTED_BY_MM` |
| assign-truck | `APPROVED` | FTE MM | `FOR_DOCKING` after recording transient `ASSIGNED` events |
| mark-docked | `FOR_DOCKING` | any Doc Officer or any Ops PIC | partial field update, or `DOCKED` once driver and trip are present |
| confirm | `DOCKED` | Doc Officer | `CONFIRMED` |

`ASSIGNED` is written and then replaced by `FOR_DOCKING` inside one database transaction. Other requests cannot observe it, even though documentation, UI types, metrics, and indexes treat it as a real queue state. The product should either make assignment and routing separate transitions or remove `ASSIGNED` from the external contract.

Docking is a two-party data-entry flow: Doc Officer supplies `driver_id`; Ops PIC supplies `linehaul_trip_no`. The first caller receives HTTP 200 and the UI opens a printable label even though the status remains `FOR_DOCKING`. That partial change creates no event. This behavior is covered by a test, so it is deliberate implementation rather than an accidental branch, but it conflicts with the endpoint/UI wording and the audit expectations.

## High-priority findings

### H1 — Mandatory password rotation can be cleared without changing the password

Evidence: `backend/routes/api.php:29`, `backend/app/Http/Middleware/AuthenticateSupabase.php:94`.

The middleware fetches Supabase's user `updated_at` and stores it as `supabase_user_updated_at`, but `/auth/password-changed` never reads it. Any Backroom user holding the temporary password can immediately call that endpoint and clear `must_change_password` without calling Supabase `updateUser`. The local `password_changed_at` is then set even though no remote password change was verified.

Remediation: require a trustworthy Supabase change timestamp later than `password_reset_at`, or perform the password update through a backend endpoint that can atomically validate the old state and update local state only after Supabase succeeds. Add a feature test for calling the completion endpoint without a preceding password update.

### H2 — Ops PIC docking lacks object-level ownership authorization

Evidence: `backend/app/Features/Requests/RequestAuthorizer.php:25`, `backend/app/Features/Requests/RequestService.php:45`.

Request listings scope ordinary Ops PIC users to their own rows, but transition lookup uses an unscoped row lock. `canTransition()` permits every `ops_pic` to call `mark-docked` on every request. A user who obtains another request UUID can write its trip number and potentially complete docking.

Remediation: for Ops PIC docking, require `request.created_by === actor.id`; keep Doc Officer's role-wide access if that is the intended operational rule. Exercise the service with a non-owner regression test.

### H3 — Authenticated non-FTE roles can read intraday dispatch through Laravel

Evidence: `backend/app/Features/Dispatch/DispatchController.php:11`, `supabase/migrations/015_fix_intraday_dispatch_rls.sql:3`.

Supabase RLS restricts direct `intraday_dispatch` reads to `fte_ops` and `fte_mm`. The Laravel route only requires authentication, and its database connection is privileged, so Ops PIC and Doc Officer users can bypass the intended RLS restriction through `/api/dispatch/intraday`.

Remediation: enforce the same FTE role allowlist in the controller or a central policy and test all four roles against both access paths.

### H4 — Request actions accept and persist fields unrelated to the action

Evidence: `backend/app/Features/Requests/RequestController.php:87`, `backend/app/Features/Requests/RequestService.php:68`.

Every action accepts the union of all workflow fields, and the service persists every supplied field before/with the status change. A Doc Officer confirming a request can rewrite truck size/type, plate, provide time, rejection remarks, or docked time. FTE Ops approval and Ops PIC cancellation have similar cross-step write capability.

Remediation: define an explicit input allowlist and required fields per action, reject unexpected fields, and test that each role cannot alter fields owned by another workflow step.

### H5 — Role notifications have global, not per-user, read state

Evidence: `backend/app/Features/Notifications/NotificationController.php:21`, `supabase/migrations/001_initial_schema.sql:76`.

A role-targeted notification is one row with one `read_at`. The first FTE Ops user who marks it read marks it read for every FTE Ops user. `read-all` has the same effect. This can hide work from other users and makes unread counts user-dependent only for direct notifications.

Remediation: separate notification content from per-user receipts, or fan out one notification row per intended user. Do not store user-specific acknowledgement on the shared role row.

### H6 — Historical: production deployment previously omitted scheduled work and migrations

Evidence: `docker-compose.yml:1`, `backend/bootstrap/app.php:18`, `deploy/deploy-production.sh:130`.

The current Compose topology includes a dedicated `schedule:work` container, and `deploy/deploy-production.sh` runs `php artisan migrate --force` before rollout. The `idempotency_keys` table remains owned by the Laravel migration; identity, audit, and Edge Function objects are owned by `supabase/migrations/`. This finding is retained as historical context and is remediated in the current branch.

### H7 — Historical: the production API previously used Laravel's development server

Evidence: `backend/Dockerfile:28`, `docker-compose.yml:5`, `frontend/nginx.conf:15`.

The current Dockerfile runs Supervisor with PHP-FPM and NGINX, and the Compose service does not override that command with `php artisan serve`. This finding is retained as historical context and is remediated in the current branch.

### H8 — Google Sheets mirroring can erase the sheet on a transient failure

Evidence: `backend/app/Integrations/GoogleSheets/GoogleSheetsRequestSync.php:87`.

Each sync loads the full history, clears `A:Z`, and then performs a separate update. If the update fails after the clear, the sheet remains empty until a later successful run. The full rewrite is also O(total requests + selected events) every five minutes.

Remediation: write to a staging sheet/range and swap, or update before clearing obsolete rows with a recoverable generation marker. Add retry/backoff and a maximum row policy.

## Medium-priority findings

1. **Invalid-token traffic reaches Supabase before rate limiting.** Protected groups run `supabase.auth` before `throttle:api`; rejected tokens never reach the limiter. Add an IP limiter before remote validation, then retain the actor limiter after authentication.

2. **Idempotency is not wired into the frontend and expired keys are not purged.** The middleware's locking/replay design is solid, but no frontend mutation sends `Idempotency-Key`. Rows with unique keys are retained indefinitely because cleanup only occurs when the same key is reused. Add client-generated keys and scheduled/batched expiry deletion.

3. **Remediated: Backroom provisioning now preserves completed users and only sets first-login state for new or password-repaired identities.**

4. **User audit writes are not atomic with user changes.** Create/update/disable commit first and call `userEvent()` afterward; the helper also silently does nothing when the table is absent. A failed audit insert can leave a successful change with a 500 response and no audit. Put the data change and audit insert in one local transaction and fail production readiness when the audit table is missing.

5. **Remediated: analytics uses the configured business timezone consistently for current-shift and non-PostgreSQL timestamp conversion.**

6. **The “current night shift” calculation points at a future shift between 06:00 and 18:00.** It chooses today's 18:00 start for all times after 06:00. Clarify whether daytime should show the last completed shift or the upcoming shift and encode that decision in tests.

7. **Backroom login exposes account state.** Unknown/inactive Ops IDs return 404, completed-first-login accounts return 409, and bad passwords return 401. The per-IP/per-ID limiter reduces brute force, but uniform public responses would reduce enumeration.

8. **Cookie authentication is accepted without a CSRF control.** `AuthenticateSupabase` accepts `sb-access-token` cookies on state-changing API routes, while the application primarily uses bearer tokens. Remove the cookie fallback or add an explicit same-site/CSRF design before using it.

9. **Remediated: migration 019 preflights normalized duplicates, normalizes Ops IDs, and adds partial unique indexes.**

10. **Remediated: provisioning and user management use the centralized, typed Supabase Admin client with configured timeout/TLS options.**

11. **Edge Function dependencies are floating.** `deno.land/std/http/server.ts` and `@supabase/supabase-js@2` resolved during validation to std `0.224.0` and Supabase `2.116.0`, but future deployments can resolve different code. Pin exact versions and commit a lockfile.

12. **Remediated: Edge Functions incrementally bound request bodies, cap batches, validate rows, report rejected counts, and return stable external errors.**

13. **API and architecture documentation has significant drift.** The technical specification describes Sanctum, Eloquent models, Form Requests, policies, Laravel-managed schema, and older framework versions that do not match the source. `docs/database-audit-recommendations.md` also still describes Edge Function and RLS issues that have since been fixed. Treat source-derived API/state documentation as a release artifact.

## Strengths worth preserving

- SQL values are parameter-bound, and sort/action values are allowlisted; no direct SQL-injection path was found.
- Request transitions use transactions plus `lockForUpdate`, preventing ordinary concurrent state races.
- Status changes, request events, and request notifications are written atomically inside the workflow transaction.
- Auth checks Supabase, then reloads an active local profile for every request; disabling a profile takes effect even while a remote token remains valid.
- Browser-side protected writes have no RLS policy; service-role writes remain server-side.
- Both Edge Functions now use explicit shared secrets, fail closed when secrets are missing, and set `verify_jwt = false` intentionally for server-to-server callers. The older database audit is stale on this point.
- Public and protected endpoints have basic rate limits, and Backroom login has both IP-wide and Ops-ID-specific limits.
- Request lists select explicit columns, cap page size at 100, and have useful status/creator/time indexes.
- The idempotency middleware scopes keys by actor, hashes normalized payloads, serializes concurrent callers, and replays successful JSON responses.
- Production configuration checks reject debug mode, non-HTTPS application URLs, and database connections without TLS.

## Test and validation assessment

The repository has 41 backend feature tests. They cover health/config readiness, Backroom login throttling and first-login completion, password reset rollback, access requests, request workflow authorization matrices and field allowlists, analytics date filtering, Supabase HTTP proxy options, notification read isolation, Google Sheets update ordering, idempotency replay/conflict/actor scoping/expiry cleanup, dispatch role authorization, user-management authorization and compensation, user audit atomicity, Backroom provisioning preservation/reset behavior, and PostgreSQL reporting plus migration-hardening tests. CI also runs direct Edge Function validation tests and deployment-script invariants.

Important missing coverage:

- complete route/role authorization combinations beyond the request and intraday matrices;
- real migrations and schema constraints rather than hand-built SQLite test tables;
- concurrent idempotency against PostgreSQL;
- live deployment checks for pending migrations and scheduler health.

The test suite uses SQLite schemas created inside tests rather than the real Supabase/Laravel migrations. This makes tests fast, but it cannot detect enum, RLS, trigger, constraint, PostgreSQL SQL, or migration-order failures. Add a PostgreSQL integration lane while retaining focused SQLite tests.

## Recommended remediation order

1. Close H1–H4 and add authorization/security regression tests.
2. Redesign notification receipts and make the docking state machine explicit.
3. Add migration and scheduler phases to deployment; replace `artisan serve`.
4. Make Sheets sync recoverable and repair provisioning/audit transaction behavior.
5. Wire client idempotency, purge expired keys, and add pre-auth IP throttling.
6. Add PostgreSQL/Edge Function integration tests and pin Edge dependencies.
7. Reconcile documentation with the implementation and archive stale audit claims.

## Validation performed

- Both Supabase Edge Functions passed `deno check` with Deno 2.9.7.
- PHP/Composer validation, Pint, and Laravel tests could not run: PHP and Composer were absent, Docker had no daemon, system package installation lacked privileges, and the available mise PHP plugin required missing native build tools.
- CodeRabbit CLI review was invoked but the task runtime reported that CodeRabbit review is disabled for this task; no CodeRabbit findings were produced.

