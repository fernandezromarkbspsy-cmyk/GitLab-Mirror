# Frontend Tailwind Migration Audit

**Audit date:** 2026-09-26  
**Scope:** `frontend/` styling architecture only  
**Migration mode:** Incremental, visual-preserving, and reversible

## Current loading order

`frontend/src/main.tsx` loads the styling layers in this order:

1. `styles/tokens.css` - canonical SOC5 and authentication custom properties.
2. `styles/tailwind.css` - Tailwind v4 entry point and Tailwind theme aliases.
3. `styles/main.css` - global application and authentication presentation.
4. `styles/template-migration.css` - current shell, dashboard, request-page, and responsive overrides.

All four CSS files are active and must remain loaded. Later files currently win intentional cascade conflicts.

## Tailwind foundation

- Tailwind CSS v4 is already installed and imported with `@import "tailwindcss"`.
- PostCSS already uses `@tailwindcss/postcss`; no Tailwind JavaScript config is required for v4.
- Vite processes the existing PostCSS pipeline successfully.
- `components.json` points shadcn-style tooling at `src/styles/tailwind.css` and the `@/lib/utils` alias.
- `cn()` already combines `clsx` and `tailwind-merge`.
- Radix/shadcn-style UI and login components already use Tailwind utilities.

No dependency or framework replacement is needed.

## Active and inactive legacy styling

| File | State | Current responsibility | Migration treatment |
|---|---|---|---|
| `tokens.css` | Active | SOC5, auth, typography, and compatibility tokens | Preserve as token source of truth |
| `tailwind.css` | Active | Tailwind v4 generation and theme exposure | Extend only with aliases to existing tokens |
| `main.css` | Active | Global/authentication presentation and compatibility rules | Keep until consumers are migrated and visually verified |
| `template-migration.css` | Active | Most application shell, dashboard, table, request, and responsive styling | Migrate selector groups component by component |
| `base/_base.scss` | Not imported | Legacy base rules referencing an older token vocabulary | Do not delete in this phase; review provenance before cleanup |

## Component migration map

### Already Tailwind-led

- Login primitives and forms under `components/login/`.
- `components/ui/scroll-area.tsx`.
- Portions of `LinehaulFilterPanel`, `RequestTable`, `Skeleton`, `Dashboard`, `DockingConfirmation`, `OutboundRequests`, `Overview`, and `UserManagement`.

These components still intentionally coexist with compatibility classes from the legacy stylesheets.

### Legacy-CSS-led

- Application shell: `AppSidebar`, `AppHeader`, and workspace layout.
- Dashboard cards, panels, charts, and queues.
- Request tables, detail panels, dialogs, and printable labels.
- User-management tables and operational page layouts.
- Shared loading and error-state presentation.

## Duplication and conflict findings

1. `tokens.css` is the canonical SOC5 token source, but `tailwind.css` currently exposes only authentication aliases. SOC5 page, panel, sidebar, ink, muted, line, and lime tokens are not yet available as named Tailwind utilities.
2. `template-migration.css` contains a second request-page token family (`--lh-2026-*`). It is active and should be consolidated only while migrating the request surfaces that consume it.
3. `main.css` includes generated-looking Tailwind custom properties alongside authored compatibility rules. It remains active and cannot be treated as generated output.
4. Several components combine Tailwind utilities with legacy semantic classes. This is safe during migration, but each selector group needs a single owner before removal.
5. `_base.scss` is not imported by the application and references older variables, but its deletion is deferred until repository history and downstream tooling are confirmed.

## Incremental plan

1. Expose the existing SOC5 tokens through Tailwind v4 theme aliases without changing token values.
2. Migrate one shared primitive at a time, beginning with pagination, and remove only selectors whose consumers are proven absent.
3. Continue through buttons, inputs, badges, cards, tables, dialogs, and skeletons before touching the application shell.
4. Preserve `main.css`, `template-migration.css`, and SCSS until their remaining consumers reach zero.
5. For every group, run lint, unit tests, production build, and an affected visual check.

## Migration progress

- `Pagination` is Tailwind-led; its dedicated legacy selectors were removed after repository-wide reference verification.
- `LinehaulFilterPanel` buttons, search input, date input, menus, and responsive layout are Tailwind-led; its dedicated legacy selectors were removed after repository-wide reference verification.
- `StatusBadge` is the single Tailwind-led request-status renderer across shared tables, request lists, cards, and details; semantic status tokens preserve the existing success, pending, informational, and danger treatments.
- `Panel` is Tailwind-led and uses semantic card tokens for its surface, border, radius, shadow, and typography; legacy panel selectors remain because page-owned panel markup still consumes them.
- The base `Skeleton` shape and its head, subtle, short, pill, and avatar variants are Tailwind-led; list, card-list, and table skeleton layouts remain scheduled separately.
- The shared SOC5 and active linehaul color tokens are exposed to Tailwind through aliases; the original custom properties continue to own their values.

## Risks

- Import order is part of the current visual contract; reordering CSS can cause broad regressions.
- Some utility-looking classes are overridden by high-specificity compatibility selectors in `main.css`.
- The request UI token family differs from the global SOC5 palette and cannot be merged mechanically.
- Authenticated operational screens require seeded credentials for full Playwright regression coverage.
