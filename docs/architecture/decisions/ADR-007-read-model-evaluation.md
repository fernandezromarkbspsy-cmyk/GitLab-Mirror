# ADR-007: Defer CQRS and Reporting Read Models

## Status

Accepted and deferred pending workload evidence.

## Problem

The dashboard and KPI views issue aggregate queries over the transactional
`requests` table. A separate read model could isolate reporting workloads from
request state transitions, but it would introduce synchronization, freshness,
backfill, and operational complexity.

## Evidence

The current implementation shows:

- Request metrics aggregate by status with role and date filters.
- Request analytics aggregate truck sizes and calculate a bounded 13-hour shift
  view from `request_timestamp`.
- KPI summary uses bounded timestamp ranges for total, confirmed, cancelled,
  and average approval time.
- KPI daily uses a bounded timestamp range and groups by business calendar date.
- Request date predicates use direct timestamp bounds that can use the existing
  timestamp index.
- Request mutations remain transactional and append events and notifications in
  the same transaction.
- No production query latency, database time, table size, lock contention, or
  reporting concurrency measurements are available.
- No materialized views, reporting tables, event consumers, or aggregation jobs
  currently exist.

The current evidence does not show that reporting reads are overloading the
transactional workload.

## Decision

Do not introduce full CQRS, event sourcing, materialized views, reporting tables,
or an aggregation worker in Phase 7.

Keep reporting queries in the modular monolith over PostgreSQL until measurement
shows a material separation benefit. PostgreSQL remains the source of truth for
both transactions and current reports.

## Workload Evaluation

| Workload | Current shape | Read-model suitability |
| --- | --- | --- |
| Request queue | Filtered, paginated transactional rows | Low; must remain current |
| Status metrics | Small grouped aggregate with filters | Low to medium; measure first |
| Truck-size analytics | Small grouped aggregate and bounded shift window | Low to medium; measure first |
| KPI summary | Four bounded aggregates over a date range | Medium; candidate if query cost grows |
| KPI daily | Bounded date-range grouping | Medium; candidate for pre-aggregation at scale |
| Request events | Append-only history by request | Medium; retain as event history, not a CQRS read side yet |

## Read-Model Adoption Gate

A future selective read model requires:

1. Query timing and query-plan evidence showing reporting materially affects API
   or database latency.
2. Table-size and growth measurements showing the workload will not remain
   comfortably indexable on the transactional table.
3. A freshness target agreed with dashboard users.
4. A rebuild/backfill procedure from authoritative requests and events.
5. Idempotent update processing and a strategy for missed or duplicated events.
6. A consistency fallback when the read model is delayed or unavailable.
7. Monitoring for read-model lag, rebuild duration, row counts, and divergence.
8. Focused tests comparing read-model results with authoritative queries.

## Alternatives Considered

- **Materialized PostgreSQL view:** simplest future option for stable aggregate
  reports, but refresh cost and freshness must be measured first.
- **Dedicated reporting table:** offers incremental updates but requires reliable
  event consumption, backfill, and reconciliation.
- **Full CQRS/event sourcing:** disproportionate to the current small-team
  modular monolith and not justified by current evidence.
- **Caching aggregate responses:** evaluated separately in ADR-003 and deferred
  because freshness and query-cost evidence are not yet available.

## Implementation

No runtime or schema changes are made by this ADR. Existing indexed queries,
request transactions, API contracts, and report tests remain unchanged.

## Trade-offs

Reports continue to share the transactional database. This keeps correctness
and operational ownership simple, but aggregate query cost may grow with request
volume. The adoption gate makes that growth measurable before introducing a
second source of derived data.

## Failure Modes

Because no derived read side is introduced, there are no new read-model lag,
reconciliation, event-consumer, or stale-report failure modes. Existing query
errors remain visible through the API and request telemetry.

## Rollback Strategy

No rollback is required. A future read-model change must be introduced as a
separate focused phase with schema, backfill, reconciliation, monitoring, and
freshness validation.
