# SOC5 Outbound Frontend Audit Report

> **Audit Date:** August 1, 2026  
> **Target Application:** SOC5 Outbound Web (`frontend/`)  
> **Audit Scope:** Architecture, Component Design, Accessibility, Responsiveness, Performance, State Management, CSS/Tailwind Usage, and Reusable Components.

---

## 1. Executive Summary

The **SOC5 Outbound Web** frontend is a logistics operations dashboard built with **React 19**, **TypeScript 5.8**, **Vite 6.3**, **TanStack React Query v5**, **Zustand v5**, and **Supabase JS**. It manages critical outbound logistics workflows including Linehaul (LH) requests, Midmile truck requests, docking confirmation, KPI analytics, and role-based user management.

### Key Strengths
- **Modern Core Libraries:** React 19, TypeScript, TanStack Query v5 for server state caching, and Zustand for global UI state.
- **Code-Splitting:** Lazy loading of top-level pages (`React.lazy` + `Suspense`) in `Dashboard.tsx`.
- **User Feedback & Loading States:** Dedicated skeleton tables (`SkeletonTable.tsx`) and notification toasts.
- **Form & Search Optimization:** Usage of `useDeferredValue` for fast, responsive filtering without input lag.

### Key Areas for Improvement
- **Monolithic CSS Architecture:** Single 68 KB unminified SCSS file (`main.scss`) with 865+ lines mixing variables, global resets, utility classes, and component styles.
- **Zero Tailwind Usage:** Tailwind CSS is completely absent despite modern design requirements, leading to high maintenance overhead for CSS rules and duplicate color/spacing values.
- **Accessibility & Focus Management:** Missing focus trapping in modal dialogs (`Modal.tsx`), unannounced toast notifications, and unlabelled icon-only interactive elements.
- **Desktop-Locked Layouts:** Tables require a fixed `1376px` minimum width, causing overflow and horizontal scrolling breaks on smaller laptops, tablets, and mobile devices.
- **Manual Routing Implementation:** Navigating between views relies on `window.history.pushState` and `window.addEventListener('popstate')` instead of a declarative router (e.g. React Router).
- **Web Audio Leak:** `AudioContext` is instantiated repeatedly in `AppHeader.tsx` without calling `close()`, leading to potential browser audio context leaks.

---

## 2. Comprehensive Analysis

### 2.1 Folder Structure
- **Current Layout:**
  ```text
  frontend/src/
  ├── components/   # 11 flat components (AppHeader, AppSidebar, RequestTable, etc.)
  ├── hooks/        # 1 custom hook (useQueueNotifications.ts)
  ├── lib/          # 3 utilities (api.ts, requests.ts, supabase.ts)
  ├── pages/        # 9 top-level view components (Dashboard, Overview, OutboundRequests, etc.)
  ├── stores/       # 1 Zustand store (ui.ts)
  ├── styles/       # Monolithic main.scss (68 KB)
  ├── types.ts      # Core TypeScript type definitions
  ├── App.tsx       # Auth state resolution & top-level view rendering
  └── main.tsx      # QueryClient provider & root entry point
  ```
- **Observations:**
  - Structure is clean at high level, but `components/` and `pages/` lack sub-grouping (e.g., feature domains like `outbound/`, `midmile/`, `common/ui/`).
  - SCSS is not modularized; no CSS modules or component-level stylesheets.

### 2.2 Component Architecture
- **Monolithic Page Components:** `OutboundRequests.tsx` (184 lines) and `MidmileRequests.tsx` contain data fetching, modal forms, table filters, column visibility logic, bulk selection handlers, and CSV export.
- **Routing:** Navigation logic is hand-crafted with `window.history.pushState` inside `Dashboard.tsx`. Re-implementing browser history manually bypasses standard route-level error boundaries and deep-linking patterns.
- **Data Fetching:** Excellent query invalidation patterns with TanStack Query. Query keys are structured systematically (`['requests', ...]` and `['notifications', ...]`).

### 2.3 Design Consistency
- **Color Token Divergence:** SCSS variables `$primary: #2c6df2` and `$navy: #172554` are established, but hardcoded hex values (`#64748b`, `#334155`, `#dfe7f0`, `#ebf1f6`, `#f8fbff`, `#eef5ff`, `#0f172a`) appear throughout SCSS files and inline JSX attributes.
- **Border Radii & Shadows:** Radius variables range from `$radius-sm: 0` to `$radius-xl: 24px`. Buttons and table cards alternate between `4px`, `8px`, `12px`, `24px`, and `999px` without a clear design hierarchy.
- **Typography:** Relies on system font stack fallback starting with `Inter`. Headline hierarchy (`h1`, `h2`, `h3`) is visually consistent, but section headers use varied tracking and font weights across pages.

### 2.4 Accessibility (a11y)
- **Modal Focus Trapping:** `Modal.tsx` supports `Escape` key close and backdrop clicks, but lacks focus trap functionality (`focus-trap-react` or Radix Dialog equivalent). Pressing `Tab` while a modal is open shifts focus into background document elements.
- **Screen Reader Announcements:** Dynamic notification toasts in `AppHeader.tsx` use `role="status"`, but live region announcements (`aria-live="polite"`) are missing for incoming notifications.
- **Icon Buttons:** Inline action buttons (e.g., table copy buttons, expand toggle buttons) lack descriptive `aria-label` text indicating their current state (e.g., `aria-expanded` is present on expand buttons, but accessible text like `"Expand details for request LH-1024"` is omitted).

### 2.5 Responsiveness
- **Fixed Width Tables:** `.request-table` defines `min-width: 1376px` with four sticky columns (`expand`, `status`, `timestamp`, `cluster`). On screens under `1400px`, sticky positioning overlays table body content awkwardly.
- **Header Tools Stacking:** `AppHeader.tsx` flex layout wraps poorly on screens smaller than `1024px`, squeezing search inputs, date range pickers, and user profile switchers.
- **Sidebar Mobile Drawer:** `AppSidebar.tsx` supports `open` state, but backdrop overlay interactions and body scroll-locking are incomplete on mobile viewports.

### 2.6 Performance
- **AudioContext Resource Leak:** In `AppHeader.tsx` (line 43), `new AudioContext()` is created inside a `useEffect` callback without closing the instance. Chrome limits active audio contexts per document (maximum 6), causing console warnings after repeated notifications.
- **Deferred Values:** Effective use of React 19's `useDeferredValue` for non-blocking table filter recalculations.
- **DOM Size:** `SkeletonTable` generates clean loading markup without excessive DOM node depth.

### 2.7 State Management
- **Server State vs. Client State:** Clean separation between server state (TanStack Query) and local UI state (Zustand for global search/date filters, React `useState` for page-local dialogs).
- **Zustand Store (`ui.ts`):** Compact and effective store interface (`search`, `dateFrom`, `dateTo`, `viewRole`).

### 2.8 Tailwind & CSS Architecture
- **Current State:** **0% Tailwind CSS**. Styling is handled completely by `main.scss`.
- **Gap:** Modernizing the UI per `AGENTS.md` design directives will benefit significantly from adopting Tailwind CSS (v4) or utility-first CSS tokens, which will eliminate the 68 KB monolithic SCSS codebase and enable instant dark mode / responsive utilities.

### 2.9 Reusable Component Opportunities
- **Primitives Needed:**
  1. `Button` (variants: `primary`, `secondary`, `danger`, `ghost`, `icon`)
  2. `Card` / `MetricCard` (standardized stat panel container)
  3. `Badge` / `StatusBadge` (centralized color mapping for `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`, etc.)
  4. `Input` / `Select` / `DateRangePicker`
  5. `ToastContainer` / `Toast` (accessible live region notification layer)

---

## 3. Categorized Audit Issues

### 🔴 Critical Issues
| ID | Issue Description | Impact | Location |
|---|---|---|---|
| **CRIT-01** | **Web Audio API Resource Leak** | Creating `new AudioContext()` on every notification without calling `.close()` depletes browser audio resources and throws browser warnings. | `src/components/AppHeader.tsx` (L43) |
| **CRIT-02** | **Modal Dialog Missing Focus Trap** | Users can tab out of active modals into background interactive elements, breaking keyboard accessibility and screen reader flow. | `src/components/Modal.tsx` |

### 🟡 Medium Issues
| ID | Issue Description | Impact | Location |
|---|---|---|---|
| **MED-01** | **Monolithic 68 KB SCSS File** | High CSS specificity risk, duplicate style definitions, hard to maintain or theme. | `src/styles/main.scss` |
| **MED-02** | **Desktop-Only Fixed Table Width** | `min-width: 1376px` causes severe horizontal overflow on laptops (1280px / 1366px) and mobile devices. | `src/styles/main.scss`, `src/components/RequestTable.tsx` |
| **MED-03** | **Manual History API Routing** | Custom `window.history.pushState` logic in `Dashboard.tsx` can lead to unsynchronized browser history states. | `src/pages/Dashboard.tsx` (L36-L49) |
| **MED-04** | **Unannounced Live Notifications** | Notification toasts lack `aria-live="polite"` region container, rendering screen reader users unaware of updates. | `src/components/AppHeader.tsx` (L88) |

### 🟢 Minor Issues
| ID | Issue Description | Impact | Location |
|---|---|---|---|
| **MIN-01** | **Hardcoded Hex Colors in Component Markup** | Inconsistent color tokens and design system violations. | `src/pages/Dashboard.tsx` (L69), `src/components/AppHeader.tsx` |
| **MIN-02** | **Inconsistent Radius Utilities** | Radii values vary arbitrarily from `4px` to `24px` without clear design tokens. | `src/styles/main.scss` |
| **MIN-03** | **Duplicate Filter Component Patterns** | Filtering controls scattered between `RequestFilters.tsx` and inline page controls. | `src/pages/OutboundRequests.tsx`, `src/pages/MidmileRequests.tsx` |

---

## 3. Recommendations & Strategic Roadmap

### Phase 1: Immediate Bug Fixes & Refactoring (Non-Breaking)
1. **Fix AudioContext Leak:** Store single AudioContext instance or ensure `.close()` is called after tone playback in `AppHeader.tsx`.
2. **Enhance Modal Accessibility:** Implement focus trapping in `Modal.tsx` using `useEffect` keyboard trap listener or standard focus trap utility.
3. **Add ARIA Live Region:** Wrap notification toasts in `<div aria-live="polite" aria-atomic="true">` in `AppHeader.tsx`.

### Phase 2: Design Modernization & Styling Architecture
1. **Adopt Utility-First / Design Tokens:** Transition monolithic `main.scss` into modular component styles or introduce Tailwind CSS for consistent spacing, colors, and responsive layouts.
2. **Responsive Table Enhancements:** Allow table columns to collapse gracefully or introduce responsive card view fallback for viewports `< 1024px`.
3. **Component Standardization:** Extract reusable UI primitives (`Button`, `Card`, `Badge`, `Modal`, `TableContainer`).

### Phase 3: Developer Experience & Code Health
1. **Declarative Routing:** Standardize navigation using React Router routes while preserving existing URL paths (`/dashboard`, `/outbound/lh-request`, `/midmile/truck-request`, `/docking`, `/kpi`, `/users`).
2. **TypeScript Strictness & Validation:** Keep all TypeScript types valid and expand type coverage for API payloads.
