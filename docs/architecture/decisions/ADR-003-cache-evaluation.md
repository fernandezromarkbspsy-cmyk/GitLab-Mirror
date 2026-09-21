# ADR-003: Defer Server-Side Read Caching

## Status

Accepted and deferred pending workload evidence.

## Problem

The dashboard polls request queues, metrics, analytics, and intraday data every
15 seconds. Caching could reduce repeated database reads, but an unqualified
cache would risk stale operational data, cross-role data leakage, and difficult
invalidation.

## Evidence

The current implementation shows:

- Laravel uses cache only for a 30-second Supabase token identity lookup.
- The dashboard request, metrics, analytics, and dispatch reads are mutable and
  are filtered by date and actor role.
- Cluster search data is updated by Supabase Edge Functions, outside Laravel's
  cache invalidation path.
- The frontend TanStack Query client already uses a 10-second default stale time,
  while dashboard polling is explicit at 15 seconds.
- No production query latency, database time, read volume, cache hit rate, or
  concurrent operator measurements are currently available.

These facts do not prove that server-side caching would improve the system.

## Decision

Do not add Laravel read-through caching, Redis, Valkey, or cache-specific
invalidation code in Phase 3.

PostgreSQL remains authoritative. Existing browser query caching and the
short-lived authentication token cache remain unchanged.

## Candidate Evaluation

| Read | Cache suitability | Reason |
| --- | --- | --- |
| Request list | Low | Mutable, role-scoped, date/filter-dependent, already paginated |
| Request metrics | Low to medium | Mutable and filter-dependent; needs measured query cost |
| Request analytics | Low to medium | Mutable and date/shift-dependent; needs measured query cost |
| Intraday dispatch | Medium | Time-windowed operational data; freshness requirement is not documented |
| Cluster search | Medium | Potentially reusable, but Edge Function writes have no Laravel invalidation hook |
| Supabase token identity | Already cached | Existing 30-second bounded cache is directly tied to authentication cost |

## Cache Introduction Gate

A future cache change requires all of the following:

1. Request telemetry shows a repeated read is a material contributor to database
   or API latency.
2. A cache key includes every authorization and filter dimension that affects
   the result.
3. An explicit freshness target and TTL are approved for the workflow.
4. Every writer or synchronization path has an invalidation or versioning plan.
5. Cache failure falls back to PostgreSQL without changing correctness.
6. Hit rate, stale responses, latency, and cache errors are observable.
7. Focused tests cover key isolation, expiry, invalidation, and cache outages.

## Alternatives Considered

- **Redis/Valkey read-through cache:** deferred because infrastructure and
  invalidation complexity are not justified by current evidence.
- **Longer browser stale times:** deferred because it would reduce freshness
  without measuring operator tolerance.
- **Materialized reporting tables:** deferred until query plans and table growth
  show that indexed transactional reads are insufficient.
- **Endpoint consolidation:** separate from caching and should be evaluated
  against measured dashboard request overhead.

## Implementation

No runtime code or infrastructure is changed by this ADR. The Phase 1 request
telemetry provides the measurement surface needed to revisit this decision.

## Trade-offs

The system may perform repeated reads that a cache could reduce. In exchange,
operational dashboards keep a simple freshness model, PostgreSQL remains the
single source of truth, and no new shared infrastructure is required.

## Failure Modes

Because no new cache is introduced, there are no new stale-read, cache outage,
key collision, or invalidation failure modes. Existing token cache behavior
continues to be governed by the authentication middleware configuration.

## Rollback Strategy

No rollback is required. A future caching implementation must be a separate
focused change with its own tests, metrics, invalidation design, and ADR update.
