# ADR-005: Bound Google Sheets Network Calls

## Status

Accepted and implemented in Phase 5.

## Problem

Google Sheets synchronization is an external network operation executed by the
Laravel scheduler. Supabase HTTP calls already have explicit connect and total
request timeouts, but the Google API client was created without application-level
timeout bounds. A stalled Google request could therefore hold the scheduler
process longer than intended.

## Evidence

`GoogleSheetsRequestSync` performs spreadsheet update and stale-cell cleanup
through the Google API client. The scheduler invokes it every five minutes and
the operation is independent of interactive API requests. Existing tests prove
that failed updates do not clear current sheet values, but no timeout was
configured for the external client.

## Decision

Configure the Google API client's Guzzle HTTP client with:

- 5-second connection timeout.
- 30-second total request timeout.

The values are environment-configurable through
`GOOGLE_SHEETS_CONNECT_TIMEOUT` and `GOOGLE_SHEETS_TIMEOUT`.

## Alternatives Considered

- **Retry Google calls:** deferred until timeout and failure measurements show
  that transient errors justify retries; retries must preserve update-before-clear
  ordering and avoid duplicating unsafe writes.
- **Move sync to a queue:** deferred under ADR-004 until scheduler duration and
  failure evidence justify worker infrastructure.
- **Circuit breaker:** deferred because there is no dependency failure-rate
  baseline or shared breaker state.

## Implementation

- Added Google Sheets timeout configuration in `config/services.php`.
- Applied the values when constructing the Google API client's Guzzle client.
- Documented safe defaults in `.env.example`.
- Added focused configuration coverage to the Google Sheets integration tests.

## Trade-offs

The scheduler now fails a sync attempt sooner when Google is unreachable or
slow. This can leave the sheet at its previous state until the next scheduled
run, but it prevents an indefinite scheduler stall. The existing write-before-
clear sequence remains unchanged.

## Failure Modes

Timeouts surface as the existing command failure path and are reported through
Laravel's exception reporting. No credentials or request payloads are logged by
this change.

## Rollback Strategy

Restore the previous Google client construction or increase the environment
timeouts if measured production latency exceeds the defaults. No schema or API
rollback is required.