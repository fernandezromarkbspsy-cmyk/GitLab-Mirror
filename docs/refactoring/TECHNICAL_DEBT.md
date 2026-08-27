# Technical Debt

This document captures **code smells**, **architectural debt**, **tight coupling**, **large files**, and **legacy patterns** discovered during each sprint. Entries are organized by sprint to help prioritize remediation.

---

## Sprint 1

| File / Module | Category | Description of Debt | Impact | Suggested Fix | Owner |
|---------------|----------|----------------------|--------|---------------|-------|
| `src/utils/helpers.ts` | Code Smell | Functions exceed 50 lines and contain nested callbacks | Hard to test, readability suffers | Refactor into smaller pure functions; extract to separate module | Backend Lead |
| `src/components/OrderList.tsx` | Architecture | Direct DOM manipulation via `document.querySelector` | Breaks React rendering model | Replace with refs and React state handling | Frontend Lead |
| `src/services/api.ts` | Coupling | Service imports both Axios and Fetch APIs | Inconsistent error handling | Consolidate to a single HTTP client | API Owner |
| `src/pages/Dashboard.tsx` | Large File | File size 2,300+ lines | Increases build times | Split into logical sub‑components | Frontend Lead |
| `legacy/` (folder) | Legacy Pattern | Uses jQuery for DOM utilities | Not compatible with modern bundler | Migrate to native JS / React utilities | Migration Team |

## Sprint 2

| File / Module | Category | Description of Debt | Impact | Suggested Fix | Owner |
|---------------|----------|----------------------|--------|---------------|-------|
| `src/store/index.ts` | Coupling | Global store accessed directly in many components | Difficult to track state changes | Introduce selectors and encapsulate access | State Team |
| `src/styles/theme.scss` | Legacy Pattern | Hard‑coded color values scattered throughout | Prevents theming | Move colors to SCSS variables and central theme map | CSS Owner |
| `src/styles/main.scss` | Legacy Pattern | Global SCSS mixes shell, page‑level and component styles, hindering separation | High coupling, hard to maintain layout changes | Refactor into separate SCSS modules (shell/, pages/, components/) per SCSS_ARCHITECTURE | Frontend Lead |
| `src/styles/main.scss` | Legacy Pattern | Hard‑coded dark‑theme values remain after token migration | Visual inconsistency, harder to maintain dark mode | Replace hard‑coded values with token variables from SCSS foundation | Frontend Lead |

---

## How to Add New Debt
1. Append a new row under the appropriate sprint section.
2. Use **Category** values: `Code Smell`, `Architecture`, `Coupling`, `Large File`, `Legacy Pattern`.
3. Fill **Impact** (e.g., "maintenance overhead", "performance hit").
4. Suggest a concrete **Fix** and assign an **Owner**.

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026‑08‑01 | Antigravity (AGY) | Created Technical Debt template |

## Sprint 3

| File / Module | Category | Description of Debt | Impact | Suggested Fix | Owner |
|---------------|----------|----------------------|--------|---------------|-------|
| `src/components/Sidebar.tsx` | Architecture | Mobile drawer open state reused for desktop; missing dedicated collapse toggle | Limits UI flexibility for collapsed rail state in desktop view | Implement a desktop collapse toggle (deferred to Sprint 4) | Frontend Lead |

---

## Sprint 4

| File / Module | Category | Description of Debt | Impact | Suggested Fix | Owner |
|---------------|----------|----------------------|--------|---------------|-------|
| `src/components/Header.tsx` | Architecture | Header JSX contains many inline styles and heavy markup, reducing readability | Maintenance overhead, harder to update UI consistently | Refactor Header to extract styled components / use CSS modules; schedule for later cleanup | Frontend Lead |

---


## How to Add New Debt
1. Append a new row under the appropriate sprint section.
2. Use **Category** values: `Code Smell`, `Architecture`, `Coupling`, `Large File`, `Legacy Pattern`.
3. Fill **Impact** (e.g., "maintenance overhead", "performance hit").
4. Suggest a concrete **Fix** and assign an **Owner**.

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026‑08‑01 | Antigravity (AGY) | Created Technical Debt template |
