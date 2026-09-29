# Frontend Tailwind Migration Audit

**Audit date:** 2026-09-27
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

Classification is based on the rendered `className` values and their active selector ownership in `main.css` and `template-migration.css`:

- **Tailwind-led:** presentation is expressed by utilities; a global animation or consumer-supplied class does not make the component hybrid.
- **Hybrid:** utilities own part of the presentation, but active legacy selectors still own a visible state or nested layout.
- **Legacy-CSS-led:** the component's own presentation is primarily owned by semantic selectors in an active legacy stylesheet.

### Tailwind-led components

- `LinehaulFilterPanel.tsx`
- `Pagination.tsx`
- `SkeletonTable.tsx`
- `SkeletonStatus` in `Skeleton.tsx`
- `StatusBadge.tsx`
- `dashboard/MetricCard.tsx`
- `dashboard/Panel.tsx`
- `ui/scroll-area.tsx`
- `login/FooterBar.tsx`, `login/LoginBackdrop.tsx`, and `login/UserTypeToggle.tsx`

### Hybrid components still requiring migration

| Component | Remaining legacy dependency | Impact radius |
| :--- | :--- | :--- |
| `Skeleton.tsx` | `SkeletonRequestTable` still composes `lh-table-row` and `lh-table-grid`; the shimmer keyframe remains globally defined. | Request loading states |
| `Modal.tsx` | The shared overlay is Tailwind-led, but consumer-supplied `form-dialog` and `print-dialog` panels remain legacy-CSS-led. | Shared dialogs across operational pages |
| `login/AmbientGlows.tsx` | `drift` and `drift-slow` still own animation behavior. | Authentication background |
| `login/BackroomLoginForm.tsx` | `rise` and `btn-shine` still own entrance and button-shine effects. | Backroom authentication |
| `login/FteLoginForm.tsx` | `rise` and `btn-shine` still own entrance and button-shine effects. | FTE authentication |
| `login/LoginCard.tsx` | `login-modal-layer` and `login-modal-card` still control modal visibility and card presentation. | Authentication shell |
| `login/OtpVerify.tsx` | `rise` still owns entrance animation. | OTP authentication |
| `login/QrPanel.tsx` | `dot-grid`, `ping-soft`, and `floaty` still own decoration and animation. | QR authentication panel |
| `login/Reveal.tsx` | `reveal` and `is-in` still control entrance presentation. | Login reveal transitions |

### Legacy-CSS-led shared components not yet migrated

| Component | Active selector families | Primary consumers / impact |
| :--- | :--- | :--- |
| `AppHeader.tsx` | `app-topbar`, `topbar-*`, `notification-*`, `profile-*` | Every authenticated view; high impact |
| `AppSidebar.tsx` | `app-sidebar`, `sidebar-*`, `nav-*` | Every authenticated view and responsive navigation; high impact |
| `ColumnVisibilityMenu.tsx` | `column-visibility*`, `toolbar-button` | Request-table column controls |
| `ErrorBoundary.tsx` | `state`, `error` | Application failure fallback |
| `OutboundRequestForms.tsx` | `inline-create-*`, `cluster-*`, `notice`, `secondary-button` | Outbound inline-create workflows |
| `PrintableTruckLabel.tsx` | `print-*`, `truck-label*`, `label-value`, shared legacy buttons | Midmile print workflow |
| `RequestFilters.tsx` | `request-controls`, `request-status-tabs`, `request-toolbar`, `filter-field`, `toolbar-button` | Shared request filtering |
| `RequestTable.tsx` | `request-table*`, `request-column*`, `request-row`, `request-detail-*`, row action selectors | Shared operational tables; high impact |
| `dashboard/ChartHeader.tsx` | `intraday-head`, `panel-kicker` | Dashboard chart headers |
| `dashboard/QueuePreview.tsx` | `dashboard-list`, `compact-empty` | Dashboard queue previews |

### Page and application layouts not yet migrated

| Surface | Remaining legacy ownership |
| :--- | :--- |
| `App.tsx` / `main.tsx` | Startup, preview, and fatal-error states (`startup-loading*`, `dashboard-preview`, `state`, `error`) |
| `ChangePassword.tsx` | Authentication page wrapper, eyebrow, and error presentation |
| `Dashboard.tsx` | `app-shell`, workspace layout, dashboard preview skeletons, panels, charts, and lists |
| `DockingConfirmation.tsx` | Workspace, panel, loading toolbar, action buttons, and dialog presentation |
| `MidmileRequests.tsx` | Linehaul workspace, records table, row actions, detail/dialog states, and empty states |
| `OutboundRequests.tsx` | Linehaul workspace, table/card views, row menus, search, and toast |
| `Overview.tsx` | Scorecard layout, charts, lists, request-detail dialog, and loading toolbar |
| `UserManagement.tsx` | Page header, summaries, table, status, actions, loading state, and dialogs |

`Login.tsx` is Tailwind-led for its page-local loading and failure dialog, but it consumes the hybrid `LoginCard` authentication shell. The `ui/skiper-ui/skiper87.tsx` wrapper accepts consumer-owned classes and has no standalone presentation migration to perform.

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
- The base `Skeleton` shape plus its list, card-list, head, subtle, short, pill, and avatar variants are Tailwind-led; `SkeletonRequestTable` remains hybrid because it uses the linehaul table grid.
- `SkeletonTable` and `SkeletonStatus` are Tailwind-led. The table layout composes the shared `Skeleton` primitive with semantic card, line, page, radius, and shadow utilities; the obsolete status selector was removed.
- `MetricCard` and its dashboard loading counterpart are Tailwind-led; obsolete card, icon, copy, chip, footnote, primary, responsive, and typography selectors were removed.
- The shared modal overlay is Tailwind-led while dialog panel contents remain hybrid until the operational forms and printable label are migrated.
- `Kpi.tsx` is Tailwind-led for its page layout, metric summary cards, and daily-volume chart.
- The shared SOC5 and active linehaul color tokens are exposed to Tailwind through aliases; the original custom properties continue to own their values.

## Recommended next migration

Migrate `RequestTable` and its shared table controls next. It is the dependency boundary for the remaining operational table pages and should precede the dialog panels, application shell, and remaining page layouts. Keep sorting, expansion, copy, action, and accessibility contracts unchanged, and remove selectors only after all table consumers are converted.

## Risks

- Import order is part of the current visual contract; reordering CSS can cause broad regressions.
- Some utility-looking classes are overridden by high-specificity compatibility selectors in `main.css`.
- The request UI token family differs from the global SOC5 palette and cannot be merged mechanically.
- Authenticated operational screens require seeded credentials for full Playwright regression coverage.
