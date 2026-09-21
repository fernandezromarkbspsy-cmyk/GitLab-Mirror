# SOC5 Outbound Architecture Review

## Review Scope

This review closes the progressive system-design evaluation from Phases 0-9.
The Code Review Graph reports 1,005 nodes and 8,713 edges across 241 files.
It identifies 11 communities, no cross-community architecture warnings, and 20
untested hotspots. Graph change-frequency analysis was unavailable, so risk
conclusions exclude churn history and remain dependent on runtime measurement.

## Completed Decisions

| Phase | Decision | Result |
| --- | --- | --- |
| 0 | Architecture baseline | Modular React/Laravel/Supabase monolith documented |
| 1 | Request telemetry | Correlation IDs and structured request duration logs added |
| 2 | Database filtering | Request date predicates use direct timestamp bounds |
| 3 | Caching | Server-side caching deferred pending workload evidence |
| 4 | Queues | Queue workers deferred pending scheduler and sync measurements |
| 5 | Reliability | Google Sheets connect and total request timeouts added |
| 6 | Real-time | Existing polling retained; Realtime/SSE/WebSockets deferred |
| 7 | Read models | CQRS/materialized reporting deferred pending query and growth evidence |
| 8 | Infrastructure | Single-host Compose topology retained; scaling gates documented |

## Preserved Contracts

The phases preserve:

- Supabase browser authentication and Laravel token validation.
- Appwrite migration compatibility as an external/protected surface.
- Laravel API response shapes and request state transitions.
- PostgreSQL migrations, RLS, authorization, and transaction boundaries.
- Existing scheduler behavior and Google Sheets write-before-clear ordering.
- Sentry integration and GitLab CI validation stages.
- Existing frontend routing, role handling, query state, and polling behavior.

## Remaining Risks

### High priority

- High-degree frontend hubs lack direct focused tests. This is tracked as
  `RF-007` for OutboundRequests and `RF-011` for AppHeader, Overview,
  MidmileRequests, and UserManagement.
- Production workload evidence is still incomplete: endpoint percentiles,
  database timings, query plans, scheduler duration, and dependency failure
  rates are not present in the repository.

### Medium priority

- Scheduler deployment checks process presence but not scheduled-work progress.
- Five-second notification and role-queue polling may become expensive as
  concurrent operators increase.
- Supabase Realtime publication is enabled but has no client subscription tests;
  any future push transport must retain polling fallback.
- The graph has unresolved call edges and no semantic embeddings.

## Deferred Work Order

1. Collect production measurements using request telemetry and Sentry.
2. Add focused frontend tests for the tracked dashboard hubs.
3. Add scheduler command duration and last-success telemetry.
4. Re-evaluate caching, queues, read models, and push transport from measured
   workload evidence.
5. Re-evaluate horizontal infrastructure only after capacity and availability
   targets are defined.

## Final Architecture Position

The system should remain a small, understandable modular monolith. PostgreSQL
and Supabase remain authoritative; Laravel remains the transaction and
authorization boundary; the frontend remains a query-driven client; and Docker
Compose remains the deployment unit. Additional infrastructure is justified only
when measurements demonstrate a specific reliability, capacity, or latency
problem that the simpler architecture cannot meet.
