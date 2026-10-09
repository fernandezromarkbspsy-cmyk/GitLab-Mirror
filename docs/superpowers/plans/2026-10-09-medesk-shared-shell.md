# Medesk Shared Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Install the Medesk registry block and adapt its navigation provider, sidebar, topbar, page surface, and shell so they wrap all existing authenticated pages without replacing existing application content or routing.

**Architecture:** The registry's shell components and CSS become the presentation layer inside the current React application. React Router remains the source of truth for pathname, navigation, auth, and page selection; a thin adapter supplies the Medesk provider with the current route and maps shell navigation events back to existing routes. Existing dashboard/request page components remain business-content children of the shared shell.

**Tech Stack:** React 19, React Router 7, Tailwind CSS 4, shadcn/ui, Lucide, Vite, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-09-medesk-shared-shell-design.md`

## Global Constraints

- Preserve existing URL paths, authentication rules, API contracts, form fields, and business actions.
- Mount one Medesk navigation provider around authenticated pages; do not use the registry demo's sample-data page or blank-route behavior.
- Keep React Router authoritative for direct entry, back/forward, and navigation.
- Preserve role-aware visibility, notifications, loading/error states, focus states, and mobile usability.
- Do not overwrite unrelated working-tree changes.

## Review Focus

- Provider/router synchronization: pathname changes from links, browser history, and direct entry must update the selected sidebar item; test in the shell integration task.
- Role-aware navigation: hidden or disabled routes must remain consistent for authenticated roles; test with existing auth/session fixtures.
- Mobile shell state: opening and closing the sidebar must not mutate route state or introduce horizontal overflow; test in responsive E2E coverage.
- Page content containment: dashboard and request pages must retain their existing content/actions inside the new shell; test with current page/component suites.
- Token and CSS collision: registry CSS must not break login or existing page-level components; verify with build plus authenticated and login Playwright checks.

### Task 1: Install and inventory the Medesk registry block

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/components.json`
- Create: registry-generated files under `frontend/src/components/watermelon/medesk-dashboard/` and any required `frontend/src/components/ui/` primitives
- Modify: `frontend/src/styles/tailwind.css` only if required by generated shadcn components or registry token integration

**Interfaces:**
- Produces the Medesk shell components, `DashboardLayout`, `DashboardNavigationProvider`, theme provider, CSS, and required primitives for later tasks.

- [ ] **Step 1: Run the registry add command from `frontend/`**

Run:

```powershell
npx shadcn@latest add https://registry.watermelon.sh/r/medesk-dashboard.json
```

Expected: the declared packages and registry files are added without replacing existing application files unexpectedly.

- [ ] **Step 2: Inspect the generated file list and package diff**

Confirm the generated shell files exist, the declared dependencies are present, and no unrelated source files were overwritten. Resolve any generated path or alias conflict before proceeding.

- [ ] **Step 3: Run the focused type/build check**

Run `npm run build` from `frontend/`.

Expected: the registry installation compiles before application integration begins.

### Task 2: Add the React Router navigation adapter and shared provider boundary

**Files:**
- Create: `frontend/src/components/shell/MedeskNavigationAdapter.tsx`
- Create or modify: `frontend/src/components/shell/AuthenticatedShell.tsx`
- Modify: `frontend/src/App.tsx`
- Test: `frontend/src/components/shell/AuthenticatedShell.test.tsx`

**Interfaces:**
- `MedeskNavigationAdapter` consumes the current React Router location and navigate function and exposes the route selection/navigation callbacks expected by the registry navigation provider.
- `AuthenticatedShell` accepts the existing authenticated page content and renders it inside the provider plus Medesk layout.

- [ ] **Step 1: Write failing shell integration tests**

Cover:

```text
renders authenticated children inside the shared shell;
marks the current existing route as selected;
invokes React Router navigation when a shell nav item is activated;
does not route registry demo blank paths.
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run `npm test -- src/components/shell/AuthenticatedShell.test.tsx`.

Expected: FAIL because the adapter and shared shell boundary do not exist yet.

- [ ] **Step 3: Implement the adapter and provider boundary**

Keep the registry provider mounted once around authenticated content. Normalize existing route IDs/pathnames into the provider's selected navigation value and map provider navigation events to existing app routes through `useNavigate`.

- [ ] **Step 4: Run the focused test and verify it passes**

Run the same focused Vitest command.

Expected: PASS, including direct route selection and navigation behavior.

### Task 3: Migrate the authenticated shell presentation

**Files:**
- Modify or replace: `frontend/src/components/AppSidebar.tsx`
- Modify or replace: `frontend/src/components/AppHeader.tsx`
- Modify: `frontend/src/components/shell/AuthenticatedShell.tsx`
- Modify: `frontend/src/styles/tailwind.css`
- Modify: `frontend/src/lib/uiClasses.ts` only for compatibility aliases that are still consumed
- Test: existing shell/component tests plus `frontend/e2e/responsive-shell.spec.ts`

**Interfaces:**
- Existing role/profile/notification props remain available to the migrated visual components.
- Authenticated page children render through a stable content outlet with no page-specific route logic moved into the shell.

- [ ] **Step 1: Characterize current shell behavior with existing tests**

Run the relevant component tests and `npx playwright test e2e/responsive-shell.spec.ts --project=chromium` from `frontend/` before changing the shell. Record the current baseline and any pre-existing failures.

- [ ] **Step 2: Replace shell framing with Medesk structure and styling**

Use the generated Medesk sidebar/topbar/layout classes and tokens. Preserve existing app logo, role-aware links, notification/profile controls, mobile toggle semantics, and accessibility labels. Keep registry sample navigation/data components out of the rendered application path.

- [ ] **Step 3: Verify responsive shell behavior**

Run the responsive shell Playwright test and relevant component tests. Confirm desktop sidebar, mobile drawer, topbar controls, content sizing, and no horizontal overflow.

### Task 4: Integrate existing dashboard and page surfaces

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/pages/Overview.tsx`
- Modify: page-level shell consumers only where they assume ownership of viewport background/height
- Test: existing dashboard/page tests and relevant E2E specs

**Interfaces:**
- Existing queries, realtime updates, loading states, empty states, error states, and page actions remain unchanged.

- [ ] **Step 1: Add or update focused rendering assertions**

Assert existing dashboard content markers and page actions render inside the shared shell rather than the registry demo content.

- [ ] **Step 2: Remove conflicting page-frame styles only**

Retain content-specific cards, charts, tables, and controls. Remove or override only duplicate viewport background, shell padding, fixed-height, and top-level overflow rules that conflict with the shared Medesk frame.

- [ ] **Step 3: Run affected tests**

Run dashboard/page Vitest tests and the authenticated outbound/request Playwright specs.

Expected: existing content and actions remain present and functional inside the new shell.

### Task 5: Full verification and integration review

**Files:**
- Inspect all changed frontend files and generated registry files.

- [ ] **Step 1: Run the full frontend test suite**

Run `npm test` from `frontend/` and require zero failures.

- [ ] **Step 2: Run lint and production build**

Run `npm run lint` and `npm run build` from `frontend/`.

- [ ] **Step 3: Run relevant E2E checks**

Run the login-entry, responsive-shell, scorecards-layout, and outbound-requests Playwright specs using the repository's configured environment.

- [ ] **Step 4: Review the final diff and working tree**

Confirm only the approved shell migration, registry installation, compatibility styling, tests, and plan/spec artifacts changed. Preserve unrelated user modifications and report any environment-limited checks.
