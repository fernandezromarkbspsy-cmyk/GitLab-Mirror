# ADR-006: Retain Polling for Operational Updates

## Status

Accepted and deferred pending real-time workload evidence.

## Problem

The dashboard displays notifications, role-specific request queues, and request
status changes. Supabase Realtime publication is enabled for `notifications`,
but the frontend currently polls notifications and role queues every five
seconds. The architecture baseline must distinguish an enabled publication from
an active client transport.

## Evidence

The current implementation shows:

- `public.notifications` is added to the `supabase_realtime` publication.
- No frontend `channel`, `postgres_changes`, or `subscribe` call exists.
- `AppHeader` polls `/notifications` every five seconds.
- `useQueueNotifications` polls the role-specific `/requests` queue every five
  seconds while an authenticated dashboard is active.
- Notification and request status reads are protected by Laravel authentication
  and role authorization.
- No measured freshness requirement, notification latency, polling load, or
  concurrent operator count is available.

## Decision

Retain authenticated polling as the active real-time transport for Phase 6. Do
not add SSE, WebSockets, or a Supabase Realtime client subscription yet.

Polling is simple, already implemented, and provides a predictable fallback when
the browser loses a persistent connection. The Supabase publication remains
available for a future focused change.

## Transport Evaluation

| Transport | Current assessment | Decision |
| --- | --- | --- |
| Polling | Existing five-second notification and queue reads | Retain |
| Supabase Realtime | Publication exists, client subscription absent | Evaluate after evidence |
| SSE | One-way updates fit some workflows, but adds server connection lifecycle | Defer |
| WebSockets | Bidirectional communication is not required by current workflows | Defer |

## Realtime Adoption Gate

A future Realtime change requires:

1. A documented freshness target for notifications and status changes.
2. Measured polling volume and latency showing material benefit from push
   delivery.
3. Verified RLS behavior for both user-targeted and role-targeted notifications.
4. Client tests for subscription setup, reconnect, authorization changes, and
   cleanup on sign-out or role switch.
5. Query invalidation or event application that preserves TanStack Query cache
   consistency.
6. Polling fallback when the channel is unavailable.
7. Monitoring for connection count, disconnects, reconnect storms, and dropped
   events.

## Alternatives Considered

- **Supabase Realtime now:** attractive because publication is already enabled,
  but authorization and client lifecycle behavior are not covered by current
  tests.
- **SSE:** simpler than WebSockets for one-way updates, but requires a Laravel
  connection endpoint and proxy timeout/connection management.
- **WebSockets:** unnecessary for the current read-and-mutate HTTP workflow.
- **Longer polling interval:** could reduce load but would change freshness
  without evidence of operator tolerance.

## Implementation

- Added the actual notification and queue polling behavior to the architecture
  baseline.
- Recorded the current polling decision and Realtime adoption criteria here.
- No runtime behavior changed.

## Trade-offs

Five-second polling adds repeated authenticated reads and can delay updates by
up to one polling interval. In exchange, it has a simple failure model and does
not introduce persistent connections or a second client-side event path.

## Failure Modes

When polling fails, existing query error states remain visible and the next
polling cycle can recover. A future push implementation must retain this polling
fallback so transient channel failures do not hide operational updates.

## Rollback Strategy

No runtime rollback is required. Any push transport must be introduced as a
separate change with its own tests and deployment review.
