# ADR-001: Request Correlation and Timing Telemetry

## Status

Accepted and implemented in Phase 1.

## Problem

Laravel had structured logs for selected failures and Sentry exception handling,
but it did not emit a consistent identifier or duration for every HTTP request.
That made it difficult to connect a frontend request, an API response, and a
server-side log entry when measuring dashboard and request workflow performance.

## Evidence

The Phase 0 graph and source inspection identified the dashboard as a critical
flow with four independent requests polling every 15 seconds. Existing logs
covered selected Supabase and external-service failures, but no global request
telemetry middleware was present.

## Decision

Add a global Laravel middleware that:

- Accepts a bounded `X-Request-Id` value or generates a UUID.
- Stores the identifier on the request.
- Returns the identifier in the `X-Request-Id` response header.
- Logs method, path, status, duration in milliseconds, request ID, and actor ID.
- Excludes request bodies, authorization headers, tokens, and secrets.

The middleware does not alter response payloads, authentication, authorization,
rate limits, database behavior, or API routes.

## Alternatives Considered

- **Sentry-only tracing:** useful for exceptions, but insufficient for complete
  request latency and successful-request measurement.
- **Frontend-only timing:** cannot measure Laravel middleware, database, or
  external dependency time reliably.
- **Distributed tracing infrastructure:** deferred until baseline measurements
  show that request logs and Sentry context are insufficient.

## Implementation

- `backend/app/Http/Middleware/RequestTelemetry.php`
- Global registration in `backend/bootstrap/app.php`
- Feature coverage in `backend/tests/Feature/RequestTelemetryTest.php`

## Trade-offs

- One structured log entry is emitted for each HTTP request, increasing log
  volume modestly.
- The request ID is intentionally limited to a safe character set and length;
  invalid incoming values are replaced with a generated UUID.
- Duration is application elapsed time, not a full database or network timing
  breakdown. Detailed query timing remains a Phase 1 follow-up measurement.

## Failure Modes

Telemetry must never block the request. Request ID generation and logging use
local application code; the middleware returns the response even when the
incoming ID is absent or invalid. No external telemetry service is required for
request completion.

## Rollback Strategy

Remove the middleware registration and middleware/test files. This change is
backward-compatible because it adds only a response header and log records.
