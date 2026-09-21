# ADR-004: Defer Laravel Queue Adoption

## Status

Accepted and deferred pending workload evidence.

## Problem

The application has Laravel queue configuration, but the default connection is
`synchronous` and no queue jobs or worker container are currently deployed. The
scheduler runs Google Sheets synchronization, idempotency cleanup, and audit
retry commands directly.

The Google Sheets synchronization is an external, independent operation and is
the strongest candidate for asynchronous processing. Moving it to a queue
without measuring its cost would add worker, job storage, failed-job handling,
and deployment complexity.

## Evidence

The current implementation shows:

- `requests:sync-google-sheet` runs every five minutes with scheduler-level
  overlap prevention.
- The sync reads all request rows and relevant request events before replacing
  the configured sheet range.
- A configured maximum row limit prevents unbounded spreadsheet payloads.
- The sync updates the sheet before clearing stale cells, so a failed update does
  not erase the current sheet.
- Existing tests cover failed update ordering and successful stale-cell cleanup.
- `audit:retry-user-events` already has an application-level retry table with
  attempt count, delayed availability, row locking, and exponential delay.
- Docker Compose has an API and scheduler but no queue worker.
- No scheduler duration, external API latency, backlog, or failure-rate baseline
  is currently available.

## Decision

Do not introduce Laravel queue jobs, a queue worker, database queue tables, or
Redis/Valkey in Phase 4.

Keep the current scheduler execution model until measurement demonstrates that a
scheduled operation is slow enough, resource-intensive enough, or operationally
independent enough to justify asynchronous processing.

## Candidate Evaluation

| Operation | Queue suitability | Current decision |
| --- | --- | --- |
| Google Sheets sync | Medium to high | Measure duration and failures first |
| User audit retries | Medium | Existing retry table already provides bounded retry behavior |
| Idempotency cleanup | Low | Short local database cleanup; keep scheduled |
| Request transitions | Low | Must complete transactionally in the HTTP request |
| Notifications | Low | Currently part of request transaction and API behavior |

## Queue Introduction Gate

A future queue change requires:

1. Measured command duration and percentile latency.
2. Evidence that scheduler execution can delay or overlap other scheduled work.
3. A job timeout, retry count, exponential backoff, and failure policy.
4. An idempotency strategy proving repeated execution is safe.
5. A bounded payload strategy; jobs must not serialize large request datasets.
6. Worker health monitoring and failed-job visibility.
7. Deployment support for queue storage and a worker process.
8. Focused tests for dispatch, retry, timeout, failure, and duplicate execution.

## Measurement Plan

Extend command/job telemetry before introducing a worker:

- Record command start, completion, duration, outcome, and row counts.
- Record Google API latency and failure categories without credentials.
- Track scheduler overlap or missed-run behavior.
- Track user-event retry attempts and age of the oldest pending retry.
- Compare Google Sheets sync duration with the five-minute schedule interval.

If the sync approaches the schedule interval, creates overlap pressure, or shows
transient external failures that benefit from independent retries, move it to a
small dedicated job with explicit retry and timeout settings.

## Alternatives Considered

- **Database queue plus worker:** simplest durable Laravel option, but requires
  new queue and failed-job schema, a worker container, and operational checks.
- **Redis/Valkey queue:** unnecessary until measured throughput or concurrency
  requires it.
- **Longer scheduler interval:** may reduce load but would reduce mirror
  freshness and does not improve failure isolation.
- **Synchronous execution:** retained because it is currently understandable,
  isolated in its own container, and not shown to be a bottleneck.

## Implementation

No runtime code or infrastructure is changed by this ADR. Existing Google Sheets
sync tests and deployment scheduler checks remain unchanged.

## Trade-offs

The scheduler process remains responsible for the full sync duration, and a
transient Google failure waits for the next scheduled attempt. This avoids adding
worker infrastructure before its operational benefit is demonstrated.

## Failure Modes

No new failure modes are introduced. Existing command failure reporting and
scheduler restart behavior remain in place. The current sync's safe write-before-
clear ordering remains the protection against partial sheet replacement.

## Rollback Strategy

No rollback is required. A future queue implementation must be a separate
focused change with its own deployment, monitoring, retry, idempotency, and ADR
updates.
