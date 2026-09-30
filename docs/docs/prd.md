# Product Requirements Document

## Problem

Truck requests are coordinated through a Google Sheet, which provides weak access
control, limited auditability, and fragile handoffs. SOC 5 Outbound provides one
role-aware workflow with a complete event trail and live status updates.

## Users

- Ops PIC creates and tracks own requests.
- FTE Ops reviews requests and manages users.
- FTE MM assigns trucks or returns requests with a reason.
- Doc Officer records docking, driver, and trip details.

## MVP

Authentication, role-based navigation, paginated request lists, request creation,
approval/bulk approval, rejection, truck assignment, docking, confirmation,
notifications, event history, user administration, and basic daily KPIs.

Later phases may add Google Sheet import/export, email digests, richer analytics,
and measured performance improvements. Vector search is not a product requirement.

## Success measures

- Every state change is attributable and auditable.
- No role can perform an unauthorized transition.
- Common API requests meet a 500 ms p95 target under expected internal usage.
- No request is lost during a handoff.
- The MVP runs within provider free-tier constraints.

## Primary journey

Ops PIC creates request -> FTE Ops approves -> FTE MM assigns a plate -> Doc
Officer marks docked and confirms driver/trip details -> stakeholders see the
updated state and audit trail.

## Non-goals for MVP

Microservices, sharding, dedicated load balancers, Pinecone, multi-region failover,
and speculative writes. These add cost and operational risk without current demand.

