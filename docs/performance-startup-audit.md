# Startup performance optimization

## Findings (main branch, 2026-10-15)

- `frontend/src/App.tsx` delays all routes behind a mandatory 2,000 ms startup animation (400 ms with reduced motion).
- `App.tsx` fetches `/auth/me` before rendering authenticated routes. This server check is necessary to establish current roles and password-change requirements; a local session is not sufficient authorization.
- `frontend/src/pages/Dashboard.tsx` already lazy-loads its views, and TanStack Query is already in use. Avoid replacing these existing mechanisms.
- `frontend/src/lib/api.ts` retrieves the Supabase session for protected requests; inspect this path for redundant refreshes before altering it.

## Implemented

- Reduce the decorative startup animation to 250 ms (400 ms for reduced-motion users remains unchanged). Authentication and authorization checks remain mandatory.

## Follow-up work (not implemented)

1. Instrument navigation, first contentful paint, /auth/me, dashboard requests and query waterfalls on throttled mobile networks.
2. Review Supabase session restoration and refresh behavior, ensuring no unauthenticated or unprovisioned account sees protected data.
3. Persist only allowlisted, non-sensitive dashboard aggregates, scoped to user and role, with expiration and logout invalidation. Never persist tokens, driver IDs, request details, or approvals.
4. Parallelize independent queries and deduplicate fetches using existing TanStack Query facilities; retain real-time invalidation.
5. Audit Laravel query counts and indexes; use measured slow endpoints to prioritize fixes.
6. Add startup regression tests, build/typecheck/lint and Playwright network-throttling measurements before release.

No 10x performance claim is made without measurements.
