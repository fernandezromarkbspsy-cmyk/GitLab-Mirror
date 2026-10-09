# SOC 5 Outbound staging-readiness audit

Date: 2026-10-09 (Asia/Singapore)

## Scope and repository state

- Audited revision at start: `dc949bc9a3aae4d399ae5935bf69123a96e0e15a`.
- Branch: `main`.
- Start state: clean working tree, tracking `origin/main`; no `MERGE_HEAD`, rebase state, or cherry-pick state.
- Current state: implementation changes are intentionally uncommitted and unpushed; the current patch includes the prior remediation plus the follow-up corrections described below. Deployment was not run.
- Code Review Graph was available and refreshed before targeted inspection and after the final edits; the final incremental update completed without graph errors.

The initial checkout contained unresolved markers in the seven reported source files plus `tests/realtime.spec.js`, `tests/playwright.realtime.config.js`, and `e2e/realtime.spec.js`. Legitimate `=` separator lines in a checked-in certificate/document were excluded from the guard by scanning only release source paths and exact conflict-marker prefixes.

## Implemented fixes

| Finding / severity | Affected files | Implemented fix |
| --- | --- | --- |
| Unresolved merge conflicts / blocker | API middleware/routes; Medesk dashboard components; realtime tests/config | Resolved all source/test conflict markers while preserving `GET:api/v1/auth/me`, public SeaTalk config, the router navigation adapter, role-aware visibility, and callback tests. Added `npm run check:conflicts`, invoked by `scripts/preflight.ps1`. |
| OAuth callback routed to SPA / high | `frontend/nginx.conf` | Added an exact-match `location = /auth/seatalk/callback` proxy to Laravel, preserving query strings and forwarding only the explicitly trusted external protocol/client identity. |
| Session middleware and CSRF / high | `backend/routes/api.php`, `backend/bootstrap/app.php`, `backend/routes/web.php`, `backend/app/Http/Middleware/VerifySessionCsrf.php`, `frontend/src/lib/api.ts`, `backend/tests/Feature/SessionCsrfTest.php` | Applied encrypted cookies, queued cookies, and session startup consistently. Adopted Laravel's standard readable `XSRF-TOKEN` convention by excluding only that cookie from encryption; the session cookie remains encrypted. Added actual-cookie/header tests for valid, missing, tampered, logout, token refresh, and public pre-auth config flows. |
| Realtime CSP / high | `frontend/nginx.conf` | Added only Supabase `wss://*.supabase.co` and `wss://*.supabase.in` destinations to `connect-src`; no unrestricted websocket wildcard. |
| Migration drops unique backing index / blocker | `supabase/migrations/017_p2_schema_hygiene.sql` | Replaced the unsafe unconditional drop with constraint-aware remediation that never removes the required cluster upsert key. |
| Notification schema mismatch / high | `supabase/migrations/20261009000003_add_notification_updated_at.sql` | Added an additive `updated_at` column migration compatible with existing installations; AccessRequestController remains API-compatible. |
| Disabled-account reads / high | `supabase/migrations/20261009000002_harden_active_profile_read_policies.sql` | Added forward-only active-profile requirements to browser-readable profile, cluster, request, event, notification, audit-event, intraday, and notification-receipt policies. Laravel cache invalidation remains on profile disable; Supabase sessions/tokens must still be revoked by the operator/provider process. |
| Docker build context / medium | `frontend/.dockerignore`, `backend/.dockerignore`, Dockerfiles | Excluded dependency directories, all environment variants except secret-free templates, browser credentials/storage state, reports, caches, logs, and local output. `COPY . .` cannot replace frontend `npm ci` dependencies with local `node_modules`. |
| Duplicate verifier / blocker | `backend/app/Console/Commands/SystemVerifyConfig.php` | Removed the obsolete duplicate declaration; `VerifyProductionConfig` is the sole `system:verify-config` implementation. |
| Staging HTTPS safeguards / high | `backend/app/Console/Commands/VerifyProductionConfig.php`, `backend/tests/Feature/ProductionConfigTest.php`, `.env.staging.example` files | Enforced HTTPS frontend URLs and secure cookies for staging as well as production. Added a secret-free staging template with `APP_ENV=staging`, `APP_DEBUG=false`, Sheets sync disabled, and SeaTalk approvals disabled. |
| Synthetic frontend telemetry / medium | `frontend/src/lib/sentry.ts`, `backend/.env.example` | Removed the exception emitted on every frontend load. Detailed performance telemetry and Sentry logs are disabled by default in templates. |

| Password-reset preparation and remote ambiguity / high | `backend/app/Features/Users/UserController.php`, `backend/tests/Feature/BackroomPasswordResetTest.php` | Corrected the previous defect: profile-state preparation and retry staging now commit atomically under a row lock; preparation failure leaves no profile change and makes no remote call. Explicit remote rejection conditionally compensates only the same reset generation; ambiguous transport outcomes remain `remote_unknown` for reconciliation and never return the temporary password. Retry coverage now distinguishes confirmed, staged, cancelled, and unknown records. |
| Proxy trust and HTTPS forwarding / high | `frontend/nginx.conf`, `backend/bootstrap/app.php`, `backend/config/trustedproxy.php`, staging templates | Added explicit ingress CIDR handling. Frontend NGINX accepts external forwarded protocol only from loopback/private ingress ranges and otherwise uses its direct scheme. Laravel trusts forwarded headers only from configured `TRUSTED_PROXIES`; the default is empty. This is configuration/source evidence, not runtime proxy-spoofing evidence. |
| Mixed bearer/cookie identity / high | `backend/app/Http/Middleware/AuthenticateSupabase.php`, `backend/tests/Feature/AuthenticateSupabaseTest.php` | Documented and tested the preserved precedence: a valid SeaTalk session is selected before a bearer token; both credentials therefore require the cookie CSRF token, and a stale cookie does not fall back to bearer authentication. Bearer-only requests remain supported. |
| CI release gates / high | `.travis.yml`, `scripts/ci/verify-release-static.sh`, `scripts/ci/require-release-acceptance.sh` | Replaced grep-only deployment validation with Compose config/build commands, conflict/diff checks, separate encoding/robots checks, frontend and Composer vulnerability scans, manifest validation, and a tag-gated authenticated acceptance job that fails when required isolated credentials are absent. These gates are configured but not executed in this local environment. |

## Verification evidence

| Check | Status | Evidence / limitation |
| --- | --- | --- |
| Conflict-marker guard | PASS | `npm run check:conflicts` — 288 release files scanned. |
| `git diff --check` | PASS | No whitespace errors. |
| PHP syntax | PASS | `php -l` on changed PHP files. |
| Frontend source/API checks | PASS | `npm run build` ran `check:source`, `check:api-versioning`, TypeScript, and Vite. |
| Frontend encoding check | PASS | `npm run check:encoding`. |
| Frontend robots check | PASS | `npm run check:robots`. |
| Frontend lint | PASS | `npm run lint`. |
| Frontend formatting | PASS | `npm run format:check`. |
| Frontend unit tests | PASS | 18 files, 62 tests passed. |
| Frontend production build | PASS | Vite build completed successfully. |
| Backend Composer validation | PASS with warning | Valid; Composer reports only missing license metadata. |
| Laravel Pint | PASS | `vendor/bin/pint --test`. |
| Backend non-PostgreSQL tests | PASS | 125 tests, 437 assertions; PostgreSQL group excluded. |
| `system:verify-config` discovery/help | PASS | Exactly one command discovered; `--help` exposes `--staging` and `--production`. |
| Staging verifier positive/negative cases | PASS | Existing positive cases plus new insecure frontend/cookie negative case. The direct command against this developer environment correctly failed because it is not configured as staging; no local environment was changed. |
| CSRF/session regression tests | PASS | 3 SessionCsrfTest tests passed using actual response cookies/headers; the full non-PostgreSQL suite also covered password-reset and mixed-auth regressions. |
| PostgreSQL migration/integration tests | BLOCKED | Local disposable PostgreSQL service/isolated database was not available; repository marks PostgreSQL tests as CI-only. No shared database was touched. |
| Full Supabase migration chain, fresh install, upgrade, rollback/recovery | NOT RUN | Requires an isolated disposable Supabase/PostgreSQL environment. |
| NGINX callback → authenticated API → logout acceptance | NOT RUN | Requires built images and an isolated HTTPS runtime with test credentials. |
| Realtime request/intraday/cross-user/reconnect acceptance | NOT RUN | Requires isolated authenticated Supabase users and realtime service. |
| Docker Compose config/image/startup/health | NOT RUN | Docker-backed runtime was not used in this checkout; no deployment or service startup was performed. |
| Edge Function type/tests | PASS | Deno `2.9.7`: `deno check` passed and 8 function tests passed. |
| Dependency vulnerability scans | PASS | Root and frontend npm audits found 0 vulnerabilities; `composer --working-dir=backend audit --locked --no-dev --abandoned=ignore` reported no security vulnerability advisories. The same commands are configured in CI. |
| Browser authenticated E2E | NOT RUN | Requires approved local storage state and isolated HTTPS services; no production integration was contacted. |

## Fresh-install and upgrade instructions

Fresh install: apply the files in [supabase-migration-manifest.txt](supabase-migration-manifest.txt), not by numeric prefix alone. The manifest resolves the duplicate `003`, `015`, and `017` prefixes and includes the two new 20261009 migrations. Confirm `001_initial_schema.sql` creates the cluster unique constraint, then verify the unique constraint, policies, grants, triggers, and realtime publication membership after the full chain.

Upgrade: inspect the deployment's applied migration ledger before applying pending files. Do not replay or edit already-applied migrations blindly. Apply the new forward-only hardening and notification migrations, then verify policies, publication membership, constraint metadata, and column metadata. If an old deployment stopped at the previous `017_p2_schema_hygiene.sql` failure, repair/recover that isolated database first, confirm the unique constraint is intact, and resume from the first unapplied manifest entry. A database rollback is not assumed to undo remote Supabase Auth changes; use the application's `remote_unknown` reconciliation record and provider-side verification.

## Secret-free staging checklist

- Use `backend/.env.staging.example` and `frontend/.env.staging.example` as templates only; inject secrets through the staging secret store.
- Set `APP_ENV=staging`, `APP_DEBUG=false`, HTTPS `APP_URL` and `FRONTEND_URL`, `SESSION_SECURE_COOKIE=true`, and TLS-enforcing `DB_SSLMODE`.
- Use an isolated Supabase project/database and isolated test users; never reuse production service-role keys or data.
- Keep `GOOGLE_SHEETS_SYNC_ENABLED=false` and `SEATALK_APPROVAL_ENABLED=false` unless isolated test destinations, credentials, and callback signing are explicitly configured.
- Configure staging Sentry environment/release labels only if the staging DSN is approved; keep default PII and verbose telemetry disabled.
- Run `php artisan system:verify-config --staging` against the actual staging connection and required operational tables.
- Set `TRUSTED_PROXIES` only to the explicit ingress CIDRs that can terminate TLS for this environment; leave it empty when no trusted proxy exists.

## Remaining risks and owner actions

1. Platform/DevOps must run isolated PostgreSQL/Supabase migration rehearsals, including a representative upgrade from the historical `017` failure point and recovery checks.
2. Platform/DevOps must build and start the Compose images on the supported runner, validate NGINX callback routing, secure cookies, trusted ingress headers, health checks, scheduler, and logs.
3. QA/Security must run authenticated HTTPS role-isolation, CSRF/tampered-cookie, reset recovery/concurrency, realtime cross-user/reconnect, and disabled-account tests against isolated staging.
4. CI owners must add the required dependency vulnerability scans and retain authenticated integration tests as required gates rather than skipping them when credentials are absent.
5. The current configuration trusts only the documented loopback/private ingress boundary. If another proxy or network topology is added, update both the NGINX allowlist and `TRUSTED_PROXIES`, then rerun spoofing and HTTPS URL/cookie acceptance tests.
6. The configured CI gates and migration manifest still require execution on the supported Linux/Docker/PostgreSQL runner; local source evidence is not release acceptance evidence.

## Sanitized command log

- Runtime versions: Node `v26.7.0`, PHP `8.5.9`, Composer `2.10.3`, Vite `8.2.2`.
- `npm run check:conflicts`: exit 0; 288 release files scanned.
- `git diff --check`: exit 0; only Git's normal line-ending warnings were emitted.
- `npm --prefix frontend run lint`, `format:check`, `test`, and `build`: exit 0; 62 frontend tests passed and the production bundle built.
- `php -l` on changed PHP files, `vendor/bin/pint --test`, and `php artisan test --fail-on-skipped --exclude-group=postgres`: exit 0; 125 tests and 437 assertions passed.
- `composer validate --no-check-publish` and backend Composer audit: exit 0; validation has only the existing missing-license warning and the audit reported no advisories.
- Root and frontend npm audits: exit 0; both reported 0 vulnerabilities.
- `sh -n` for both CI shell scripts and `sh scripts/ci/verify-release-static.sh`: exit 0; all static release gates passed.
- `deno check` and the two Edge Function test files: exit 0; 8 tests passed.
- `php artisan system:verify-config --staging`: exit 1 as expected against the developer environment because its environment is not staging, debug is enabled, and its URL is not HTTPS. No local environment was changed.
- Docker/Compose, PostgreSQL/Supabase, authenticated browser acceptance, and staging runtime checks: not run here because the required Docker/services/credentials are unavailable.

## Final decision

**NO-GO for staging deployment.** The follow-up CSRF, password-reset, mixed-auth, callback matching, proxy-boundary, Docker-context, and CI-gate corrections are implemented and locally regression-tested where supported. The acceptance criteria are not yet met because isolated PostgreSQL/Supabase migration, Docker/NGINX HTTPS, authenticated role/realtime/reset, Edge Function, vulnerability-scan, and complete CI release-gate evidence are still unavailable. Do not deploy, push, or modify shared environments until those required checks are PASS.
