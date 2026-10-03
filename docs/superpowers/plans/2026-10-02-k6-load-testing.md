# k6 Load Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a safe, repository-grounded k6 load-testing system for the SOC 5 Outbound frontend and Laravel API.

**Architecture:** Keep production code untouched. Put reusable k6 configuration, authentication, request helpers, checks, thresholds, endpoint tags, and custom metrics in `tests/load/helpers.js`; keep each scenario file focused on workload shape. Add PowerShell wrappers with local-safe defaults and document environment variables, commands, interpretation, and safety rules.

**Tech Stack:** k6 v2.3.0 JavaScript, PowerShell, Laravel routes discovered from `backend/routes/api.php`, frontend URLs discovered from Vite and repository documentation.

**Spec:** Approved in chat on 2026-10-02.

## Global Constraints

- Create load-testing files under `tests/load/`.
- Do not modify production business logic.
- Default target is local/staging, never production.
- Use only GET and safe read-only operations by default.
- Never automate Google OAuth, SeaTalk OAuth, or repeated Supabase OTP traffic.
- Never hard-code passwords, tokens, cookies, API keys, or secrets.
- Fail clearly when required environment variables are missing.
- Use realistic pauses and staged ramps.

## Review Focus

- Target safety: production-looking URLs must require explicit opt-in and local defaults must remain intact; verify runner validation and documentation.
- Authentication: supplied bearer tokens must be reused, while optional Backroom login occurs only once in `setup()`; verify no credentials are embedded.
- Route fidelity: every exercised endpoint must exist in the inspected Laravel/frontend route inventory; verify endpoint constants.
- Missing configuration: authenticated API scenarios must fail with an actionable message when no token/login credentials exist; verify setup behavior.
- Load semantics: 10/25/50/100/200/300 users must be reached progressively without an immediate 300-VU jump; verify `load.js` stages.

### Task 1: Shared k6 helpers

**Files:**
- Create: `tests/load/helpers.js`

**Interfaces:**
- Produces `buildOptions()`, `getTargetConfig()`, `getAuthOptions()`, `request()`, `readOnlyRequest()`, `requireAuth()`, `randomPause()`, and shared custom metrics for scenario files.

- [ ] Implement environment parsing, local-safe target defaults, production-target refusal unless explicitly enabled, common thresholds, endpoint tags, JSON checks, reusable auth headers, one-time optional Backroom login support, realistic pause helpers, and custom metrics for endpoint latency/errors/request rate.
- [ ] Validate helper syntax with `k6 inspect tests/load/helpers.js` or the available k6 syntax command.

### Task 2: Smoke scenario

**Files:**
- Modify: `tests/load/smoke.js`

**Interfaces:**
- Consumes the shared helper interfaces from Task 1.

- [ ] Define one VU for a short smoke run that checks the frontend, Laravel health endpoint, public auth configuration endpoint, and authenticated critical reads when a reusable auth token or Backroom credentials are supplied.
- [ ] Keep auth-provider login endpoints out of the workload and pause between user actions.

### Task 3: Staged frontend/API load scenario

**Files:**
- Create: `tests/load/load.js`

**Interfaces:**
- Consumes the shared helper interfaces from Task 1.

- [ ] Define progressive stages reaching exactly 10, 25, 50, 100, 200, and 300 VUs with sustained plateaus, then ramp down.
- [ ] Exercise frontend and safe authenticated read paths with realistic per-VU pauses; require reusable auth for protected paths.

### Task 4: Read-only API workload

**Files:**
- Create: `tests/load/api-load.js`

**Interfaces:**
- Consumes the shared helper interfaces from Task 1.

- [ ] Define a constant-arrival read-only API workload covering `/auth/me`, `/requests`, request metrics/analytics, KPI summary/daily, intraday dispatch, notifications, clusters lookup, and users.
- [ ] Use endpoint tags and request intervals that expose slow paths without mutating application data.

### Task 5: PowerShell runners and documentation

**Files:**
- Create: `tests/load/Invoke-K6Smoke.ps1`
- Create: `tests/load/Invoke-K6Load.ps1`
- Create: `docs/testing/K6_LOAD_TESTING.md`

**Interfaces:**
- Runners invoke the scenario files and pass target/auth environment variables without logging secret values.

- [ ] Add smoke and load-level commands for 10/25/50/100/200/300 users, with local defaults and explicit safety checks.
- [ ] Document prerequisites, scenarios, environment variables, exact commands, thresholds/metrics, failure diagnosis, and staging/production precautions.

### Task 6: Verification

- [ ] Run JavaScript syntax/inspection checks for all scenario files.
- [ ] Run the smoke test against the local frontend/backend.
- [ ] Run a very small load test before any larger requested level.
- [ ] Review `git diff` and `git status`; confirm no production business-logic files changed and no secrets were added.
