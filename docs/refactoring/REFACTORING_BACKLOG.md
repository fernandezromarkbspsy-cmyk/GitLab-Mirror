# Refactoring Backlog

This is the master backlog of all refactoring, technical debt, performance, and testing‑gap items discovered during implementation sprints.

---

## Backlog Table

| ID | Sprint Discovered | Category | Priority | Status | Component | Description | Business Impact | Recommendation | Dependencies | Notes |
|:---|:---|:---|:---:|:---|:---|:---|:---|:---|:---|:---|
| RF-001 | Sprint 1 | Technical Debt | High | **Open** | `src/components/Button.tsx` | Duplicate button variant with identical markup | Reduces maintainability; risk of inconsistent UI changes | Consolidate into a single reusable Button component | None | |
| RF-002 | Sprint 2 | Performance | Medium | **Open** | `src/pages/Orders.tsx` | Unnecessary re‑render on every store update | Increases CPU usage on high‑traffic pages | Memoize component with `React.memo` | Dependent on state‑management refactor | |
| RF-003 | Sprint 2 | Legacy Cleanup | Low | **Open** | `src/styles/legacy.scss` | Unused legacy SCSS file | No functional impact but inflates bundle size | Delete file and remove import | None | |
| RF-004 | Sprint 5 | Legacy Cleanup | Medium | **In Progress** | `frontend/src/styles/template-migration.css`; `frontend/src/styles/pages/outbound-requests.css` | Outbound requests now has a route-scoped Pivora stylesheet; older outbound declarations remain in the shared migration stylesheet while unrelated page styles stay untouched | Overlapping rules can cause cascade conflicts and keep global styles harder to maintain | Continue incremental page-scoped extraction and remove replaced legacy selectors as each page is modernized | Sprint 16 outbound page, then later operational surfaces | Build and outbound E2E passed 4/4; responsive visual review remains pending |
| RF-005 | Sprint 6 | Legacy Cleanup | High | **Done** | `frontend/src/components/login` and `frontend/src/pages/Login` | Current audit finds no `.js`/`.jsx` files under `frontend/src`; the existing source-artifact guard is now part of the standard build | A generated JavaScript file could be reintroduced and shadow TypeScript sources, causing authentication source/runtime drift | Keep TypeScript as the source of truth and retain the artifact guard in the normal build | Existing `check-source-artifacts.mjs`; `npm run build` | `App.tsx` and login dependencies resolve to `.tsx`; updated build passed |
| RF-006 | Sprint 8 | Configuration | Medium | **Open** | `docs/intraday-sync-setup.md` and Google Apps Script | Sheet ID, Supabase function URL, and sync secret still require manual deployment in the Workspace script | Configuration changes require script maintenance and secret rotation is manual | Move non-secret settings to deployment configuration and document automated secret rotation | Deployment workflow | Discovered while connecting the Total Dispatch intraday chart |
| RF-007 | Sprint 9 | Testing | Medium | **Done** | `frontend/src/pages/OutboundRequests.tsx` | Focused Playwright coverage exercises filtering, sorting, export, view switching, row actions, and the empty state | Operational request interactions now have regression coverage | Maintain the focused E2E scenarios as the page evolves | Existing Playwright E2E harness | `frontend/e2e/outbound-requests.spec.ts` passed 4/4 tests |
| RF-009 | Sprint 11 | Migration Hygiene | High | **In Progress** | `supabase/migrations`; `public.provision_staged_fte()`; frontend/backend role authorization | Local versions `003`, `015`, and `017` are duplicated; `013_remove_dock_officer_role.sql` does not remove a role. Historical Supabase migration state is still unreconciled | A future CLI push could replay or skip schema changes incorrectly; `dock_officer` cleanup also affects shared authorization dependencies | Preserve historical files and `doc_officer`; reconcile the local migration chain against the live schema on a Docker-capable runner, then use uniquely versioned forward migrations only for confirmed gaps | Docker-capable schema diff and frontend/backend role contract | MCP migration `20260926000908_restore_user_imports_allowlist` and checked-in seed restored 109 active allowlist rows (22 `fte_ops`, 87 `ops_pic`); 3 existing Auth users linked, no Auth users created, profile counts unchanged. RLS enabled with no browser policies. Remote Supabase ledger now contains only this repair version; older local versions remain unmatched. No `db push` or historical repair run |
| RF-010 | Sprint 12 | Data Integrity | Medium | **Open** | `request_events` and Google Sheets sync | Historical request-created events do not retain the original Ops PIC LH type, so the mirror falls back to the current request truck type for those rows | Older rows may show the final MM-assigned type instead of the original request type | Backfill original request types from an authoritative source or add a dedicated immutable request field before relying on historical mirror accuracy | Historical request data review | New requests persist `lh_type_request` in event metadata |
| RF-011 | Sprint 13 | Resilience | Medium | **Open** | External integrations and deployment topology | Read replicas, sharding, CQRS, circuit breakers, and active worker pools require workload, failure-domain, and deployment decisions that are not represented in the current monolith | Premature adoption could break transactionality or create operational failure modes | Introduce these incrementally after baseline metrics: first shared queue/cache, then an outbox and worker pool, then read models/replicas; add circuit breakers around measured dependency failure paths | Production traffic metrics, queue backend, schema ownership, observability | Supabase Realtime and bounded Google Sheets retry are implemented now |
| RF-012 | Sprint 14 | Technical Debt | Medium | **Done** | `frontend/src/pages/OutboundRequests.tsx`; `frontend/src/components/OutboundRequestForms.tsx`; `frontend/src/hooks/useOutboundRequests.ts` | Inline forms and request data/filter/mutation lifecycle are separated from the page; DOM-dependent table and row interaction state remains local | Changes are easier to isolate and verify on a high-impact workflow | Maintain the component and hook boundaries; avoid further decomposition unless it reduces actual complexity | RF-007 complete | Focused E2E suite and frontend build passed |

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
