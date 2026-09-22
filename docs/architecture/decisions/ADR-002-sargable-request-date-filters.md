# ADR-002: Keep Request Date Filters Sargable

## Status

Accepted and implemented in Phase 2.

## Problem

Request reporting filters previously applied `AT TIME ZONE` and a `date` cast to
`request_timestamp` in PostgreSQL. That transforms the indexed column for every
row and prevents the existing plain timestamp index from being used as an
efficient range predicate.

## Evidence

Migration 011 created an index on `requests.request_timestamp` for date-window
analytics. The repository's PostgreSQL-specific predicate did not match that
index shape. The affected paths are request listing, metrics, and analytics,
which are also polled by the dashboard.

## Decision

Convert each business date boundary to a UTC timestamp using the configured
business timezone, then compare `request_timestamp` directly with `>=` or `<=`.
The database column remains unwrapped, so PostgreSQL can use the existing
timestamp index.

## Alternatives Considered

- **Expression index on the timezone/date expression:** would preserve the old
  query shape but duplicate timezone logic in database metadata.
- **Materialized business-date column:** adds write-time consistency and schema
  complexity before table size or query plans justify it.
- **Read replica or cache:** does not fix the inefficient predicate.

## Implementation

- `RequestRepository::whereBusinessDate` now emits direct timestamp bounds.
- PostgreSQL reporting coverage verifies the predicate does not contain the
  non-sargable timezone expression.

## Trade-offs

- Date-boundary conversion remains application responsibility and depends on the
  configured business timezone being correct.
- Existing indexes remain unchanged, avoiding unproven write and storage cost.
- Query plans and production latency still need to be measured before deciding
  whether further indexes are warranted.

## Failure Modes

Invalid date input is rejected by existing controller validation. A missing or
invalid timezone configuration can change business-day boundaries, so the
configured timezone must remain deployment-validated.

## Rollback Strategy

Restore the previous PostgreSQL-specific predicate only if production query
plans or correctness checks show a regression. No schema rollback is required.