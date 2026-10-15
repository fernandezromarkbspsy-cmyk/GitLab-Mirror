# Production launch security acceptance

This checklist applies to the React/Vite frontend, Laravel API, Supabase PostgreSQL/Auth, SeaTalk integration, Docker/NGINX and Travis CI. Do not change workflow authorization or approval routing as part of launch checks.

## Automated checks
- [ ] Frontend lint, tests, build, dependency audit and Playwright tests pass.
- [ ] Laravel PHPUnit suite, PostgreSQL integration suite, Pint and Composer audit pass.
- [ ] Edge Function tests and Docker Compose build pass.
- [ ] Production configuration verifier passes with production secrets (never commit secrets).
- [ ] GitLab merge protection requires resolved discussions and a trusted Travis CI commit status (verify integration before enabling a pipeline requirement).

## Runtime acceptance (must be tested in an isolated staging environment)
- [ ] Anonymous requests to protected endpoints return 401.
- [ ] Cross-user read/write and cross-role workflow actions return 403 or 404, including direct Supabase queries with real user JWTs.
- [ ] All browser-facing write operations enforce CSRF for cookie sessions; SeaTalk callbacks verify signatures.
- [ ] API and login rate limits return 429 with realistic traffic; test all public endpoints.
- [ ] Password reset links/tokens expire according to the configured Supabase Auth policy; reused tokens fail.
- [ ] CORS only allows the configured frontend origin. CORS is not authentication.
- [ ] Validate malformed inputs, SQL injection probes and stored/reflected XSS payloads against representative forms.
- [ ] Browser and API errors expose no stack traces or secrets.
- [ ] Confirm database indexes with EXPLAIN ANALYZE for production-like request/queue queries.
- [ ] Verify TLS, secure cookies, CSP, HSTS and trusted reverse-proxy configuration on deployed hosts.
- [ ] Confirm Sentry alerts and request logs work without passwords, tokens, or sensitive payloads.
- [ ] Verify Supabase backups and perform a restore into an isolated database.
- [ ] Test login, approval, rejection, dispatch, docking, printing, SeaTalk callbacks, retries and reconciliation end-to-end.
- [ ] Run a load test with defined response-time/error-rate targets and rollback drill.

## Release decision
GO only after all checks have recorded evidence, responsible owner, environment and date. Missing evidence means NO-GO. Do not run destructive tests against production.
