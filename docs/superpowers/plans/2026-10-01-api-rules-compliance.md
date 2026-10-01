# API Rules Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the documented API conventions without breaking existing clients or changing business behavior.

**Architecture:** Add a versioned `/api/v1` route surface and make the shared frontend client target it by default. Keep the existing `/api` surface as a compatibility alias during migration. Preserve existing controller/service contracts and use tests to pin route availability and method semantics.

**Tech Stack:** Laravel routes and PHPUnit feature tests; React/TypeScript/Vite; Supabase-authenticated shared API client.

**Spec:** `docs/architecture/api_rules.md`

## Global Constraints

- Collections use plural nouns.
- Status codes describe what actually happened.
- Each request method has a specific purpose.
- Query parameters handle filtering, sorting, and pagination.
- Version the API and never break existing clients.
- Preserve business logic, backend contracts, authentication, authorization, database schema, and Supabase integration.

## Review Focus

- Versioned and legacy API paths must resolve to the same handlers and middleware.
- Frontend callers must not accidentally double-prefix `/api/v1`.
- Resource collection routes must remain plural and query-driven.
- Workflow action payload validation and idempotency behavior must remain unchanged.
- Existing clients using `/api` must continue to work during migration.

### Task 1: Version the Laravel API surface

**Files:**
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/ApiRulesTest.php`

**Interfaces:**
- Produces identical route behavior under `/api/v1/*` and compatibility `/api/*` paths.

- [ ] Add feature tests asserting representative public, authenticated, collection, filtered, and workflow routes are available under `/api/v1`.
- [ ] Add tests asserting legacy `/api` routes remain available and use the same response contract.
- [ ] Refactor route registration so the versioned group owns the canonical definitions and the compatibility group reuses them without changing middleware, bindings, or handlers.
- [ ] Assert route names/resources remain plural and existing method choices are preserved where they represent commands rather than CRUD deletion.
- [ ] Run the focused PHPUnit test file.

### Task 2: Point the frontend client at the versioned API

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Test: `frontend/src/lib/api.test.ts`

**Interfaces:**
- Consumes the existing `api(path, init)` interface; callers continue passing paths beginning with `/`.

- [ ] Add a test for the default `/api/v1` base and preserve explicit `VITE_API_URL` behavior.
- [ ] Change only the default base path to `/api/v1`.
- [ ] Run the focused frontend test.

### Task 3: Verify request callers and full contracts

**Files:**
- Inspect: `frontend/src/hooks/useOutboundRequests.ts`, `frontend/src/hooks/useQueueNotifications.ts`, `frontend/src/pages/Overview.tsx`, and other `api()` callers identified by the dependency scan.
- Modify only if a caller bypasses the shared client or uses a non-plural/non-version-safe path.

- [ ] Run frontend type-check/build and the existing API tests.
- [ ] Run the backend feature suite relevant to routes, auth, requests, users, and notifications.
- [ ] Check imports, route middleware, response contracts, and diff for dead code or unrelated changes.
- [ ] Record any unrelated technical debt in `docs/refactoring/REFACTORING_BACKLOG.md` rather than expanding scope.

## Self-Review

- Spec coverage: every rule is addressed; plural resources and query filtering are verified as already compliant and protected by route/caller checks.
- Scope: no database, authentication, authorization, service, or schema changes are planned.
- Compatibility: legacy `/api` routes remain available while `/api/v1` becomes the frontend default.
