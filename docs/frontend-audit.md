# Frontend Deep-Dive Audit

Date: 2026-07-30

## Design Read

Reading this as an operational logistics dashboard for SOC 5 outbound teams, with a work-focused enterprise UI language. Target dials: design variance 3, motion intensity 2, visual density 8. The interface should prioritize fast scanning, clear queue ownership, low-friction actions, and mobile-safe operational use over marketing-style visuals.

## Executive Summary

The frontend is functional and builds successfully, but it carries several UX and maintainability risks that will show up in daily operations:

- The app still hard-locks the document to a desktop width, which defeats the later mobile CSS.
- The stylesheet has two overlapping generations of shell, topbar, table, and metric styles, creating an inconsistent visual system.
- Core request tables are dense and useful, but row expansion, action affordances, and status counts need stronger interaction design.
- Some visible strings are mojibake, so users may see broken punctuation in production.
- Dialogs, menus, tabs, and notification audio need accessibility hardening.
- The production bundle passes build but ships as a large single chunk.

## What Is Working Well

- The app has a clear role-based shell and maps users to role-specific workspaces in `frontend/src/pages/Dashboard.tsx`.
- The request table has sticky priority columns, sort affordances, copy-to-clipboard, responsive card-style fallback, and expandable details in `frontend/src/components/RequestTable.tsx`.
- Data fetching uses React Query consistently, with periodic refresh for operational freshness.
- Reduced-motion CSS exists globally in `frontend/src/styles/main.scss`.
- The production build succeeds.

## Priority Findings

### P0 - Mobile Layout Is Blocked At The Root

Evidence:

- `frontend/src/styles/main.scss:14` sets `html { min-width: 1180px; }`.
- `frontend/src/styles/main.scss:15` sets `body { min-width: 1180px; }`.
- Later mobile rules exist at `frontend/src/styles/main.scss:389`, `frontend/src/styles/main.scss:421`, and `frontend/src/styles/main.scss:431`, but they cannot fully help if the document itself refuses to shrink.

Impact:

Mobile users get horizontal scrolling before the responsive shell and table layouts can do their job. This is especially risky for dock, truck, and queue workflows that may be used away from a desk.

Recommendation:

- Remove root-level `min-width: 1180px`.
- Put desktop minimums only on specific desktop-only surfaces, such as table internals.
- Keep `.request-table { min-width: 1320px; }` for desktop horizontal scanning, then let the existing mobile table-card transform activate under 760px.
- Replace app-level `100vh` with `100dvh` where fixed mobile viewport behavior matters.

### P0 - Visible Text Encoding Is Broken

Evidence:

- `frontend/src/components/AppHeader.tsx` contains broken separator and ellipsis text in the date range and search placeholder.
- `frontend/src/pages/Kpi.tsx` uses broken fallback dash text.
- `frontend/src/pages/UserManagement.tsx` uses broken fallback dash and "Creating..." text.

Impact:

Users will see strings like mojibake punctuation rather than clean UI copy. It makes the app feel brittle and can reduce trust in operational screens.

Recommendation:

- Replace these with ASCII equivalents: `-`, `...`, or plain words.
- Add an editor and repository encoding check so UTF-8 text is preserved.

### P1 - The Visual System Has Conflicting Generations

Evidence:

- Early `.app-topbar` styling at `frontend/src/styles/main.scss:208` uses rounded glassy cards.
- Later `.app-topbar` styling at `frontend/src/styles/main.scss:564` overrides it with square, flatter styling.
- Request tables use `24px` radius at `frontend/src/styles/main.scss:53`, while app topbar controls later use `border-radius: 0` at `frontend/src/styles/main.scss:571`.
- There are two `.metric-card::after` definitions at `frontend/src/styles/main.scss:290` and `frontend/src/styles/main.scss:479`.

Impact:

The app reads as partially redesigned rather than deliberately systemized. Operators will not consciously name this, but it makes hierarchy and affordances less predictable.

Recommendation:

- Make the later `main.scss` generation the base and delete the earlier glassy/topbar variant instead of letting both coexist.
- Consolidate design tokens at the top of `main.scss`: surface, border, text, accent, danger, success, radius, shadow, spacing.
- Lock the shape system to one operational scale: `0` or `4px` for dense controls, `8px` for panels, `999px` only for pills/badges.
- Keep gradients only where they signal state, selection, or grouping; otherwise prefer flat surfaces and consistent borders.

### P1 - Request Tables Need Stronger Interaction Semantics

Evidence:

- Entire rows are clickable for expansion at `frontend/src/components/RequestTable.tsx:49`.
- Action buttons sit inside those rows and stop propagation at `frontend/src/components/RequestTable.tsx:51`.
- The expanded state is marked with `aria-expanded`, but the row itself is not keyboard-interactive.
- The table has 14 columns beginning at `frontend/src/components/RequestTable.tsx:17`.

Impact:

Mouse users can discover expansion by accident, while keyboard and screen reader users have weak affordances. Dense operational data becomes harder to scan when action and expansion behaviors compete.

Recommendation:

- Add a dedicated first-column expand button with `aria-controls`.
- Keep row click as a convenience only if the explicit button is present.
- Group low-priority fields into expansion by default: created by, created at, updated at, driver ID, rejection remarks.
- Keep the visible table optimized around queue decisions: status, request time, cluster, dock, backlog, truck size/type, assigned person, next action.
- Add hover and active states only to explicit interactive elements, not the whole row if it conflicts with table selection.

### P1 - Status Counts Are Page-Local, Not Dataset-Accurate

Evidence:

- `statusSummary` is derived from the currently loaded page in `frontend/src/pages/OutboundRequests.tsx:80`.
- The same pattern appears in `frontend/src/pages/MidmileRequests.tsx:43`.

Impact:

The status tabs can mislead users by showing counts for only the current page, while visually presenting them as queue totals.

Recommendation:

- Fetch status counts from an aggregate endpoint, or label them as "on this page".
- For operational queues, prefer true global counts by status for the active filters and date range.

### P1 - Sort Control Is A Dead Affordance

Evidence:

- `frontend/src/components/RequestFilters.tsx:40` renders a `Sort By` button without behavior.

Impact:

Users can click it and nothing happens. In an operations tool, dead controls train people not to trust the UI.

Recommendation:

- Remove it if table-column sorting is the intended mechanism.
- Or convert it to a real compact menu for common sorts: newest, oldest, cluster A-Z, backlog high-low, status.

### P1 - Dashboard Trend Badges Are Hard-Coded

Evidence:

- `.metric-card::after` hard-codes values like `+2.54%` and `-2.67%` at `frontend/src/styles/main.scss:479`.

Impact:

The dashboard can display precise but false performance trends. That is worse than having no trend indicator.

Recommendation:

- Remove pseudo-element trend text until the API provides period-over-period values.
- If trends are added, render them from data with accessible text and clear comparison period.

### P2 - Dialog And Menu Accessibility Needs Hardening

Evidence:

- Dialogs are rendered directly in `OutboundRequests.tsx`, `MidmileRequests.tsx`, `DockingConfirmation.tsx`, and `UserManagement.tsx`.
- Examples include `frontend/src/pages/OutboundRequests.tsx:139`, `frontend/src/pages/MidmileRequests.tsx:63`, and `frontend/src/pages/DockingConfirmation.tsx:47`.
- Notification and profile menus are toggled in `frontend/src/components/AppHeader.tsx`, but there is no focus trap, escape handling, click-outside close pattern, or return-focus behavior.

Impact:

Keyboard users can tab behind modals or lose their position. Menus may remain open unexpectedly. Screen reader users get inconsistent dialog naming.

Recommendation:

- Create shared `Modal`, `Popover`, and `MenuButton` primitives.
- Add escape-to-close, focus trap, return focus, click-outside close, and required `aria-labelledby`.
- Keep destructive dialogs as `alertdialog` with a clear confirm button.

### P2 - Notification Sound May Be Blocked Or Annoying

Evidence:

- `frontend/src/components/AppHeader.tsx:37` creates an `AudioContext` directly when a new notification arrives.

Impact:

Browsers often block audio until user interaction. Even when allowed, unexpected beeps in an operations room can be disruptive.

Recommendation:

- Add a user preference for sound on/off.
- Only enable sound after explicit user interaction.
- Keep visual toast and notification badge as the default.

### P2 - Loading States Are Too Generic

Evidence:

- Request screens use plain loading blocks such as `frontend/src/pages/OutboundRequests.tsx:88`, `frontend/src/pages/MidmileRequests.tsx:48`, and `frontend/src/pages/DockingConfirmation.tsx:35`.
- `.loading-block` is centered text at `frontend/src/styles/main.scss:323`.

Impact:

On slower connections, operators lose table context and cannot tell which surface is refreshing.

Recommendation:

- Use table skeleton rows matching column structure.
- For background refresh with `placeholderData`, keep existing rows visible and show a subtle "Refreshing" indicator near the toolbar.

### P2 - Bundle Needs Code Splitting

Evidence:

- `npm run build` succeeds, but Vite warns that `assets/index-B75KeBfO.js` is `537.19 kB` minified and `150.41 kB` gzip.

Impact:

The first load ships every page to every role, including pages the current user may never access.

Recommendation:

- Use `React.lazy` or route/view-level dynamic imports for pages: KPI, User Management, Docking, Midmile, Outbound.
- Consider separate chunks for Supabase/auth and chart-heavy dashboard code if bundle analysis confirms it.

## UI Enhancement Plan

### 1. Establish A Compact Operations Design System

- Replace global ad hoc colors with SCSS variables or CSS custom properties.
- Use one neutral palette and one accent. Current candidates: neutral slate/gray plus SOC teal `#2f6f6a`.
- Use status colors only for statuses and destructive states.
- Standardize radii: 8px panels, 4px controls, full pills for badges.
- Standardize shadows: subtle panel shadow only where elevation separates sticky surfaces.

### 2. Rework The Request Table For Queue Decisions

- Add explicit expand buttons.
- Freeze only the columns that operators compare constantly: status, request time, cluster.
- Make row actions fixed-width and visually grouped.
- Add a compact column-visibility strategy for secondary fields.
- Add batch action feedback, especially when `bulkApprove` is used.

### 3. Upgrade Empty, Loading, And Error States

- Replace plain text loaders with table skeletons.
- Add empty-state next actions: "Create request", "Clear filters", or "Refresh".
- Move errors close to the failed control or data region, with retry actions.

### 4. Improve Navigation And Header Ergonomics

- Keep sidebar expansion click-based instead of hover-dependent for predictable behavior.
- Make breadcrumbs secondary, not competing with the page title.
- Unify topbar styling with the rest of the app.
- Make search behavior explicit: current search navigates to request screens, so it should show scope and destination.

### 5. Accessibility Pass

- Add shared accessible modal and popover primitives.
- Ensure all icon-only buttons have labels, titles, focus states, and consistent hit areas.
- Make status tabs either real tabs with `aria-selected` and panels or plain filter buttons.
- Verify keyboard-only flows for creating, assigning, docking, confirming, exporting, and profile switching.

## Suggested Implementation Order

1. Fix text encoding and remove root `min-width`.
2. Consolidate duplicate/overriding SCSS sections.
3. Replace fake dashboard trend pseudo-elements.
4. Implement accessible modal/popover primitives and migrate dialogs.
5. Refactor request table expansion and actions.
6. Add true status-count endpoint or relabel counts.
7. Add skeleton states and background refresh indicators.
8. Add view-level code splitting.

## Verification Notes

- `npm run build` failed inside the sandbox with `spawn EPERM` from esbuild.
- Re-running the same command with approval succeeded.
- Build result: `dist/index.html` 0.41 kB, CSS 52.80 kB, JS 537.19 kB minified, JS gzip 150.41 kB.
- Vite reported a chunk-size warning for the JS bundle.
