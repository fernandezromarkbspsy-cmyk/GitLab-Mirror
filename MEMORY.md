# SOC 5 Outbound — Repository Memory

## Purpose

Role-aware truck-request portal for Shopee Sorting Facility Dispatch. It manages
request creation, approvals, truck assignment, docking, notifications, and audit
history.

## Architecture

- Frontend: React 19, TypeScript, Vite, TanStack Query, Zustand.
- Backend: Laravel 12 modular monolith.
- Database/auth: Supabase PostgreSQL, Auth, RLS, and Realtime.
- Integrations: SeaTalk Approval Center, Google Sheets, Supabase Edge Functions.
- Deployment: Docker Compose, NGINX, Cloudflare Tunnel, Sentry.
- Main folders: backend, frontend, supabase/migrations, supabase/functions,
  docs, scripts, tests.

Flow: Browser → NGINX → Laravel API → Supabase PostgreSQL. Supabase Auth handles
sessions; Edge Functions ingest external cluster/intraday data.

## Important boundaries

- Backend workflow: controller → authorizer/service → repository/query → database.
- Frontend API calls go through frontend/src/lib/api.ts.
- Request writes must validate input, authorize the actor, enforce legal status
  transitions, run transactionally, write events/notifications, and use
  idempotency where configured.
- Never bypass Laravel authorization with direct browser database writes.
- Keep provider-specific SeaTalk/Google logic inside integration adapters.

## Auth and security

- Roles include ops_pic, fte_ops, fte_mm, and admin capabilities.
- FTE login uses Supabase OTP/Google Auth; backroom login uses Laravel.
- Only publishable/anon keys may reach the browser.
- Keep service-role, database, SeaTalk, Google, and Sentry secrets server-side.
- Preserve throttling, callback signatures, RLS, profile activation checks, and
  request authorization.
- The old dock-officer role is removed.

## API

Canonical client base path: /api/v1. The backend also registers an unversioned
compatibility group.

Key areas:

- Auth: /auth/status, /auth/me, /auth/backroom/login, /auth/password-changed.
- Users: /users and user-management actions.
- Requests: /requests, metrics, analytics, events, bulk approval, and actions.
- Operations: /clusters, /kpi, /dispatch/intraday, /notifications, /presence.
- SeaTalk callbacks: /integrations/seatalk/approval/*.

Allowed request actions: approve, reject-ops, cancel, reject-mm, assign-truck,
mark-docked.

## Database

Supabase migrations are the main schema source. Apply every file in
supabase/migrations in order; add a new migration instead of editing an applied
one.

Core objects include profiles, user_imports, clusters, requests, request_events,
user_events, notifications, notification_reads, intraday_dispatch, and SeaTalk
approval/routing/callback tables.

## Local development

Requirements: PHP/Composer, Node 22/npm 10, Deno, and cloudflared when needed.

    Copy-Item backend\.env.example backend\.env
    Copy-Item frontend\.env.example frontend\.env
    .\scripts\bootstrap-machine.ps1
    .\scripts\launchers\setup-backend.ps1
    .\scripts\launchers\start-dev.ps1

Services use Laravel :8000 and Vite :5173. For Windows PHP commands:

    $env:PHPRC = (Resolve-Path .\tools\php.ini).Path

Never put secrets in committed files or VITE_ variables.

## Validation

    .\scripts\preflight.ps1

    cd backend
    php artisan test
    .\vendor\bin\pint --test

    cd frontend
    npm run lint
    npm test
    npm run build
    npm run test:e2e

Edge Functions:

    deno check supabase/functions/sync-clusters/index.ts supabase/functions/sync-intraday/index.ts
    deno test --allow-env supabase/functions/sync-clusters/index_test.ts supabase/functions/sync-intraday/index_test.ts

## Deployment

Compose services: web, api, scheduler, redis; optional worker via
docker-compose.async.yml. The public tunnel must target the production NGINX
container, not Vite.

    cd backend
    php artisan system:verify-config --staging
    cd ..
    docker compose config
    docker compose up --build -d

Do not deploy, push, publish, rotate credentials, or alter live data unless
explicitly requested.

## Known caveats

- Source, tests, migrations, and deployment config outrank older docs.
- Technical specification docs contain legacy Sanctum/Eloquent/schema guidance.
- PHP references differ: README says 8.4, Composer platform is 8.3.31, CI uses
  8.3. Verify against the active target before changing requirements.
- API examples vary between /api and /api/v1; new clients should use /api/v1.
- The dashboard performs several periodic reads; measure before redesigning.
- Use Code Review Graph before broad exploration when its project guidance applies.

## Current working tree at creation

Existing user changes were present in:

- backend/app/Http/Middleware/AuthenticateSupabase.php
- backend/routes/api.php
- untracked .seawork/

Re-check git status before editing related files.

## Maintenance

Update this file only when architecture, API, auth, migrations, setup, deployment,
validation, or a durable operational rule changes.
