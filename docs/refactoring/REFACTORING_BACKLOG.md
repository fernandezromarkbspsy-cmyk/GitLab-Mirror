# Refactoring Backlog

This is the master backlog of all refactoring, technical debt, performance, and testing‑gap items discovered during implementation sprints.

---

## Backlog Table

| ID | Sprint Discovered | Category | Priority | Status | Component | Description | Business Impact | Recommendation | Dependencies | Notes |
|----|-------------------|----------|----------|--------|-----------|-------------|----------------|----------------|--------------|-------|
| RF-001 | Sprint 1 | Technical Debt | High | Open | `src/components/Button.tsx` | Duplicate button variant with identical markup | Reduces maintainability; risk of inconsistent UI changes | Consolidate into a single reusable Button component | None | |
| RF-002 | Sprint 2 | Performance | Medium | Open | `src/pages/Orders.tsx` | Unnecessary re‑render on every store update | Increases CPU usage on high‑traffic pages | Memoize component with `React.memo` | Dependent on state‑management refactor | |
| RF-003 | Sprint 2 | Legacy Cleanup | Low | Open | `src/styles/legacy.scss` | Unused legacy SCSS file | No functional impact but inflates bundle size | Delete file and remove import | None | |
| RF-004 | Sprint 5 | Legacy Cleanup | Medium | Open | `frontend/src/styles/main.scss` | Global stylesheet still contains non-dashboard dark/glass legacy presentation for app shell and operational surfaces | Can make later Pivora modernization sprints harder to keep visually unified | Continue incremental SCSS migration by moving page/component styles into architecture folders and replacing legacy global rules only when each surface is scheduled | Sprint 6 shared UI components and later operational-page modernization | Discovered while modernizing dashboard framework |
| RF-005 | Sprint 6 | Legacy Cleanup | High | Open | `frontend/src/components/login` and `frontend/src/pages/Login` | Runtime `.js` files are maintained alongside `.tsx` source files and extensionless imports resolve to the JavaScript copies | Source/runtime drift can reintroduce authentication bugs or deploy stale behavior | Remove committed generated JavaScript or establish one documented build-generated source of truth | Build/deployment workflow review | Discovered while fixing OTP state handling |
| RF-006 | Sprint 8 | Configuration | Medium | Open | `docs/intraday-sync-setup.md` and Google Apps Script | Sheet ID, Supabase function URL, and sync secret still require manual deployment in the Workspace script | Configuration changes require script maintenance and secret rotation is manual | Move non-secret settings to deployment configuration and document automated secret rotation | Deployment workflow | Discovered while connecting the Total Dispatch intraday chart |
| RF-007 | Sprint 9 | Testing | Medium | Open | `frontend/src/pages/OutboundRequests.tsx` | Interactive recreation has no focused automated coverage for filtering, sorting, export, view switching, or row actions | UI regressions could affect operational request review without detection | Add component tests for the primary interaction paths and empty/filter states | Frontend test harness | Discovered while recreating the Outbound LH Request page |
| RF-009 | Sprint 11 | Migration Hygiene | High | Open | `supabase/migrations` | Historical migration files still include duplicate numbering and a role-removal migration that does not match the current live role model | We are at risk of future schema archaeology errors and accidental replays on a live role contract | Keep new migrations idempotent, add explicit constraint names, and defer any `doc_officer` removal until a deliberate role migration is designed and executed with frontend/backend contract updates | Active app role usage in frontend/backend and migration history review | Discovered while implementing P1 migration hardening |
| RF-010 | Sprint 12 | Data Integrity | Medium | Open | `request_events` and Google Sheets sync | Historical request-created events do not retain the original Ops PIC LH type, so the mirror falls back to the current request truck type for those rows | Older rows may show the final MM-assigned type instead of the original request type | Backfill original request types from an authoritative source or add a dedicated immutable request field before relying on historical mirror accuracy | Historical request data review | New requests persist `lh_type_request` in event metadata |
| RF-011 | Sprint 13 | Resilience | Medium | Open | External integrations and deployment topology | Read replicas, sharding, CQRS, circuit breakers, and active worker pools require workload, failure-domain, and deployment decisions that are not represented in the current monolith | Premature adoption could break transactionality or create operational failure modes | Introduce these incrementally after baseline metrics: first shared queue/cache, then an outbox and worker pool, then read models/replicas; add circuit breakers around measured dependency failure paths | Production traffic metrics, queue backend, schema ownership, observability | Supabase Realtime and bounded Google Sheets retry are implemented now |

---

## How to Add a New Entry
1. Copy a table row above and fill in the fields.
2. Use the **ID** pattern `RF-XXX` (incremental).
3. Set **Priority** and **Status** according to definitions in `README.md`.
4. Commit the change to the `docs/refactoring/REFACTORING_BACKLOG.md` file.

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026‑08‑01 | Antigravity (AGY) | Created backlog template with example rows |
