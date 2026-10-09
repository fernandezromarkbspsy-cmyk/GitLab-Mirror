# Medesk Shared Shell Design

## Goal

Adopt the Medesk registry block's sidebar, topbar, page surface, and shell styling across the authenticated frontend while preserving the application's existing dashboard content, routes, authentication, data flows, and business actions.

## Scope

### In scope

- Install the `medesk-dashboard` shadcn registry block and its declared dependencies.
- Mount the Medesk navigation provider at the authenticated application-shell level.
- Adapt the provider's navigation state to the existing React Router location and route transitions.
- Replace the current authenticated sidebar, topbar, and page frame with the Medesk visual system.
- Make the new shell shared by dashboard, outbound requests, midmile requests, docking, KPI, user management, password, and other authenticated pages.
- Restyle existing dashboard content inside the new shell without replacing it with registry sample data.
- Preserve existing mobile collapse, focus states, loading states, error states, and route behavior.

### Out of scope

- Replacing existing application data with the registry's sample data.
- Mounting the registry demo page as the application's dashboard content.
- Changing URL paths, authentication rules, API contracts, form fields, or business actions.
- Rewriting unauthenticated login pages unless required to prevent shell leakage.

## Design

The authenticated root in `frontend/src/App.tsx` will own one shared Medesk shell provider and layout. The provider will expose navigation state compatible with the Medesk shell components, while an adapter maps current `react-router-dom` locations to the application's existing route IDs and calls the existing navigation mechanism for transitions. The registry's sample route set remains unused.

`AppSidebar` and `AppHeader` will be replaced or refactored around the registry's shell primitives, keeping existing user/profile controls, role-aware navigation, notifications, and responsive behavior. The shell's content outlet will render the current page components unchanged at the business-logic boundary. Existing page-level classes will be reduced only where they conflict with the new shell's surface, spacing, or viewport ownership.

The Medesk design tokens will be integrated into the existing Tailwind v4 stylesheet without introducing a second UI framework. Existing shadcn primitives will be reused where compatible; missing registry primitives will be installed through the shadcn CLI.

## Navigation contract

- The provider is mounted once around authenticated routes.
- Browser back/forward and direct route entry remain driven by React Router.
- Sidebar selection reflects the current pathname.
- Sidebar navigation invokes React Router rather than the registry demo's internal blank routes.
- Existing role-based visibility and disabled/preview behavior remain unchanged.
- Mobile sidebar open/close state is local to the shell and does not alter route state.

## Acceptance criteria

1. Every authenticated page renders inside the Medesk shell with one consistent sidebar, topbar, page background, and responsive layout.
2. Existing dashboard content and live data remain intact inside the new shell.
3. Sidebar selections navigate to the existing application routes and accurately reflect the current route.
4. Authentication, role visibility, notifications, page actions, loading/error states, and browser navigation continue to work.
5. At mobile widths, the shell remains usable without horizontal overflow and the sidebar can be opened and closed.
6. The frontend test suite, lint, type check, production build, and relevant Playwright checks pass.

## Risks and mitigations

- **Provider/router conflict:** keep React Router authoritative and implement a thin adapter rather than using the registry demo's route provider as the source of truth.
- **Shared-shell regression:** migrate the shell before changing page internals and exercise all authenticated route families.
- **Token collision:** namespace or reconcile Medesk variables with existing tokens in one stylesheet; do not layer two competing global themes.
- **Responsive regressions:** verify desktop, tablet, and mobile shell states with existing responsive E2E coverage.
