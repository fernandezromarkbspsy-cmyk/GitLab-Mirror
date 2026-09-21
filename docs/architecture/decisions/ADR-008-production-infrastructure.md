# ADR-008: Retain the Single-Host Compose Production Topology

## Status

Accepted for the current workload; scaling changes deferred pending evidence.

## Problem

The production system needs a dependable deployment topology with safe secret
handling, startup ordering, health verification, migration control, and a clear
scaling path. The project must avoid adding Kubernetes, replicas, managed cache,
or other infrastructure without an availability or capacity requirement.

## Evidence

The current deployment provides:

- A frontend NGINX container serving fingerprinted assets and proxying `/api`.
- A Laravel API container running PHP-FPM and backend NGINX under Supervisor.
- A dedicated scheduler container running Laravel `schedule:work`.
- API health checks against Laravel `/up` with startup grace and retries.
- `restart: unless-stopped` for all Compose services.
- Production secrets loaded from AWS Secrets Manager into mode-restricted files.
- Required configuration validation before and after rollout.
- Database migrations applied before containers are replaced.
- API authentication readiness, scheduler process, and public health checks during
  deployment.
- GitLab CI validation for frontend, backend, PostgreSQL, Edge Functions, and
  deployment configuration.

The deployment script does not yet expose a scheduler heartbeat or verify that
scheduled commands are completing on time. There are also no measured traffic,
resource, availability, or recovery-time baselines that justify multiple API
replicas, Kubernetes, or managed caching.

## Decision

Keep the current single-host Docker Compose topology for the present workload.
Treat PostgreSQL/Supabase as the authoritative data service and keep the API
stateless so it can be replicated later without an application rewrite.

Do not add Kubernetes, API replicas, Redis/Valkey, a load balancer, or a second
region in Phase 8.

## Current Topology

```mermaid
flowchart TD
    Internet[Internet] --> Edge[Cloudflare or public edge]
    Edge --> Web[Frontend NGINX container]
    Web -->|static assets| Browser[React browser]
    Web -->|/api proxy| Api[Laravel API container]
    Api --> Db[(Supabase PostgreSQL)]
    Api --> Auth[Supabase Auth]
    Scheduler[Laravel scheduler container] --> Db
    Scheduler --> Google[Google Sheets API]
    Secrets[AWS Secrets Manager] --> Deploy[Deployment script]
    Deploy --> Web
    Deploy --> Api
    Deploy --> Scheduler
    Sentry[Sentry] <-- Api
```

## Operational Controls

Deployment must continue to:

1. Refuse tracked local changes on the production checkout.
2. Load secrets without printing values.
3. Validate Compose configuration.
4. Build images before rollout.
5. Apply migrations before starting the new stack.
6. Run production configuration verification.
7. Wait for API health and authentication readiness.
8. Verify scheduler process presence and public health.
9. Fail with container logs when startup or health verification fails.

The API `/up` endpoint is a liveness check, not a promise that every external
dependency is available. External dependency failures must remain visible through
request telemetry and Sentry rather than making basic process health depend on
Supabase or Google availability.

## Infrastructure Change Gate

A future infrastructure change requires measurements for:

- Sustained API request rate and p95/p99 latency.
- CPU, memory, PHP-FPM worker saturation, and container restart frequency.
- Database connection, query latency, lock contention, and storage growth.
- Scheduler command duration, missed runs, and oldest pending retry age.
- Deployment frequency, failed rollout rate, recovery time, and downtime.
- Health-check failures and Sentry error rate.

Replicas or a load balancer are justified only when a single API process or host
cannot meet the measured availability or capacity target. A queue/cache service
must satisfy the separate adoption gates in ADR-003 and ADR-004.

## Scheduler Liveness Follow-up

The current deployment verifies that the scheduler process is running, but not
that scheduled work is making progress. The next operational measurement should
record command start, completion, duration, outcome, and last-success timestamps.
A heartbeat or scheduler health endpoint should be added only after deciding the
source of truth for missed schedules and alert thresholds.

## Alternatives Considered

- **Kubernetes:** rejected for the current small-team workload because it adds
  control-plane, deployment, networking, and operations complexity without
  measured need.
- **Multiple API replicas:** deferred until capacity or availability data shows
  the single host is insufficient.
- **Managed Redis/Valkey:** deferred under the cache and queue ADRs.
- **Second region:** deferred until recovery objectives and database failover
  requirements are defined.

## Trade-offs

A single host remains a meaningful availability boundary. In exchange, the
system is understandable, inexpensive, and has a short deployment path with
explicit checks. The stateless API and external PostgreSQL service preserve a
clear path to future horizontal scaling.

## Failure Modes

- A host failure can take down web, API, and scheduler together.
- A failed migration or config check stops deployment before rollout.
- API health failure prevents dependent Compose services from starting.
- Scheduler process failure is detected at deployment, while missed scheduled
  work requires the planned progress telemetry.
- Supabase or Google failures do not automatically make the process health check
  fail; dependency errors must be monitored separately.

## Rollback Strategy

Use the deployment script's exact revision support to redeploy the previous
known-good commit after verifying configuration and health. Database migrations
remain forward-only; any schema rollback requires a separately reviewed
migration strategy.
