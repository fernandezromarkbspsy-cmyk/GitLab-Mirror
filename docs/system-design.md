# System Design

## Decision

Use a modular monolith: a stateless Laravel API and a React single-page client,
backed by Supabase PostgreSQL/Auth/Realtime. Feature boundaries preserve the
controller -> service -> repository flow without introducing network boundaries.

## Runtime flow

Browser -> Cloudflare -> NGINX -> React assets or `/api` -> Laravel -> Supabase.
Laravel verifies the Supabase JWT, applies role and transition policies, and uses
database transactions to update a request and append its event atomically.
Supabase Realtime publishes committed notification rows to authorized clients.

## Feature boundaries

`Auth`, `Requests`, `Users`, `Notifications`, and `Kpi` each own their HTTP,
business, and persistence code. Controllers parse HTTP; services enforce workflows;
repositories query data. Laravel policies are the final authorization guard.

## State machine

| From | Action / role | To |
|---|---|---|
| new | create / Ops PIC or FTE Ops | PENDING |
| PENDING, REJECTED_BY_MM | approve / FTE Ops | APPROVED |
| PENDING, REJECTED_BY_MM | cancel / owner or FTE Ops | CANCELLED |
| APPROVED | reject / FTE MM | REJECTED_BY_MM |
| APPROVED | assign / FTE MM | ASSIGNED |
| ASSIGNED | route to dock / FTE MM | FOR_DOCKING |
| ASSIGNED, FOR_DOCKING | dock / Doc Officer | DOCKED |
| DOCKED | confirm / Doc Officer | CONFIRMED |

## Data and performance

UUID primary keys avoid client-visible sequences. Composite indexes follow role
queues (`status, created_at`) and ownership (`created_by, created_at`). Lists are
cursor/paginated and select explicit columns. No cache is needed for mutable request
queues; short-lived KPI/config caching can use the database initially and Upstash
Redis later. Browser/CDN caching applies only to fingerprinted static assets.

Optimistic prefetch is limited to safe reads: hovering/focusing request rows may
prefetch details and events. Mutations are never executed speculatively. TanStack
Query may optimistically update UI only with rollback on error.

## Reliability and observability

Status update, event, and notifications share one transaction. Jobs are idempotent
and may later use Laravel's database queue. Health endpoints support NGINX/container
checks. Structured logs include request/correlation IDs. Sentry, PostHog, Better
Stack, Resend, and Upstash remain disabled unless their environment variables are
provided; their free tiers are external limits, not an availability guarantee.

## Security

Supabase owns passwords and bcrypt-compatible secure password storage. The browser
uses the public anon key only. Laravel alone uses service credentials. JWT issuer,
audience, signature, expiry, active profile, role, request ownership, payload shape,
and transition are validated. RLS denies direct protected writes. Secrets remain in
environment variables. API rate limits apply by authenticated user and IP.

## Scaling path

First tune queries and indexes. Then add queue workers and Redis for measured hot
reads. Because the API is stateless, multiple replicas can sit behind NGINX or the
hosting platform. Add Supabase read replicas/partitioning only when database metrics
justify them. Split a service only after it needs independent ownership or scaling.

