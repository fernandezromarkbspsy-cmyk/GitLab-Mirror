# Sprint 4.5 – Refactoring Review & Recommendations

## Overview
This document reviews **all entries** across the `docs/refactoring/` folder, classifies their impact, assesses whether they block the UI modernization effort, and recommends which items should be tackled in **Sprint 4.5**.

---

## Classification Key
| Level | Meaning |
|-------|---------|
| **Critical** | Immediate blocker to UI modernization or functional stability; must be resolved before the next release. |
| **High** | Significant impact on maintainability, performance, or developer experience; should be addressed in the next sprint. |
| **Medium** | Moderate impact; can be scheduled for a near‑future sprint if capacity allows. |
| **Low** | Minor annoyance or cosmetic issue; optional backlog item. |

---

## 1. Technical Debt (`TECHNICAL_DEBT.md`)
| ID | Sprint | File / Module | Category | Impact | Suggested Fix | Owner | **Severity** | **Blocks UI Modernization?** |
|----|--------|---------------|----------|--------|---------------|-------|--------------|------------------------------|
| – | Sprint 1 | `src/utils/helpers.ts` | Code Smell | Hard to test, readability suffers | Refactor into smaller pure functions | Backend Lead | Medium | No |
| – | Sprint 1 | `src/components/OrderList.tsx` | Architecture | Direct DOM manipulation | Replace with refs & state | Frontend Lead | High | No |
| – | Sprint 1 | `src/services/api.ts` | Coupling | Mixed Axios/Fetch usage | Consolidate to single client | API Owner | High | No |
| – | Sprint 1 | `src/pages/Dashboard.tsx` | Large File | 2,300+ lines | Split into sub‑components | Frontend Lead | Medium | No |
| – | Sprint 1 | `legacy/` (folder) | Legacy Pattern | jQuery usage | Migrate to native JS/React | Migration Team | Medium | No |
| – | Sprint 2 | `src/store/index.ts` | Coupling | Global store accessed directly | Introduce selectors | State Team | High | No |
| – | Sprint 2 | `src/styles/theme.scss` | Legacy Pattern | Hard‑coded colors | Move to SCSS variables | CSS Owner | Medium | **Yes** – prevents full theming tokenization |
| – | Sprint 2 | `src/styles/main.scss` (global) | Legacy Pattern | Mixed shell/page/component styles | Refactor into `shell/`, `pages/`, `components/` per SCSS architecture | Frontend Lead | High | **Yes** – high coupling hampers layout work |
| – | Sprint 2 | `src/styles/main.scss` (dark‑theme values) | Legacy Pattern | Hard‑coded dark values | Replace with token variables | Frontend Lead | Medium | **Yes** – visual inconsistency for dark mode |
| – | Sprint 3 | `src/components/Sidebar.tsx` | Architecture | No dedicated desktop collapse toggle | Add toggle (deferred to Sprint 4) | Frontend Lead | Low | No |
| – | Sprint 4 | `src/components/Header.tsx` | Architecture | Inline‑heavy JSX, hard to read | Extract styled components / CSS modules (later cleanup) | Frontend Lead | Low | No |

**Sprint 4.5 Targets (Technical Debt)**
- **`src/styles/theme.scss`** (Medium, blocks theming) – **High** priority for UI modernization.
- **`src/styles/main.scss`** global coupling (High, blocks layout work) – **Critical**.
- **`src/styles/main.scss`** dark‑theme hard‑coded values (Medium, blocks dark‑mode consistency) – **High**.
- **`src/components/Sidebar.tsx`** toggle (Low) – optional, can be deferred.

---

## 2. Component Cleanup (`COMPONENT_CLEANUP.md`)
| ID | Sprint | Component Path | Issue Type | Impact | Recommendation | Owner | **Severity** | **Blocks UI Modernization?** |
|----|--------|----------------|------------|--------|----------------|-------|--------------|------------------------------|
| CC-001 | Sprint 1 | `src/components/OldButton.tsx` | Duplicate | Increased maintenance burden | Remove & replace with `Button` | Frontend Lead | Medium | No |
| CC-002 | Sprint 2 | `src/components/Wrapper/LegacyWrapper.tsx` | Obsolete Wrapper | Redundant DOM node | Delete file & update usage | Frontend Lead | Low | No |

**Sprint 4.5 Targets (Component Cleanup)**
- **CC-001** – remove duplicate button (Medium) to keep component library tidy.
- **CC-002** – optional, low impact, can be deferred.

---

## 3. Legacy Cleanup (`LEGACY_CLEANUP.md`)
| ID | Sprint | Asset Type | Path / Identifier | Reason | Owner | Status | **Severity** |
|----|--------|------------|-------------------|--------|-------|--------|--------------|
| LC-001 | Sprint 1 | SCSS | `src/styles/legacy.scss` | Replaced by new base styles | Frontend Lead | Completed | Low |
| LC-002 | Sprint 1 | Component | `src/components/OldButton.tsx` | Duplicate of modern Button | Frontend Lead | Completed | Low |
| LC-003 | Sprint 1 | Import | `src/utils/legacy-utils.ts` | Unused after refactor | Frontend Lead | Completed | Low |

No pending legacy items remain; nothing blocks UI modernization.

---

## 4. Performance (`PERFORMANCE.md`)
| ID | Sprint | File / Component | Issue Type | Impact | Suggested Fix | Owner | **Severity** |
|----|--------|------------------|------------|--------|---------------|-------|--------------|
| PF-001 | Sprint 1 | `src/pages/Dashboard.tsx` | Rendering Issue | High CPU usage | Wrap with `React.memo` | Frontend Lead | Medium |
| PF-002 | Sprint 2 | `src/assets/bundle.js` | Bundle Size | Slow mobile load | Code‑splitting & lazy‑load | Frontend Lead | High |
| PF-003 | Sprint 2 | `src/components/Chart.jsx` | Re‑render | Jank during interaction | Use `useMemo` & `React.memo` | Frontend Lead | Medium |

**Sprint 4.5 Targets (Performance)**
- **PF-002** (Bundle size) – **Critical** for delivering a fast UI.
- **PF-001** and **PF-003** – Medium, can be scheduled after bundle work.

---

## 5. Test Gaps (`TEST_GAPS.md`)
| ID | Sprint | Area | Gap Type | Impact | Recommendation | Owner | **Severity** |
|----|--------|------|----------|--------|----------------|-------|--------------|
| TG-001 | Sprint 2 | Layout | Missing Regression Test | Risk of UI regression | Add Cypress test for column order | QA Lead | High |
| TG-002 | Sprint 2 | Component | Missing Unit Test | Reduces confidence | Add Jest unit tests for FilterBar | QA Lead | Medium |
| TG-003 | Sprint 2 | CRG | Missing CRG Test | Undetected API failures | Add CRG error‑branch tests | QA Lead | Medium |
| TG-004 | Sprint 2 | Layout | Missing Regression Tests (9 gaps) | Increased risk of UI regressions | Add comprehensive Cypress suite covering shell, page, component layout | QA Lead | Critical |

**Sprint 4.5 Targets (Test Gaps)**
- **TG-004** – Critical; must provide regression safety for the new layout.
- **TG-001** – High; address specific layout regression.
- **TG-002** & **TG-003** – Medium, can follow.

---

## 6. Refactoring Backlog (`REFACTORING_BACKLOG.md`)
Current backlog items are all **Open** with varying priorities. The items that directly affect UI modernization are:
- **RF‑001** (Duplicate button component) – **Medium** → already covered by Component Cleanup CC‑001.
- **RF‑002** (Unnecessary re‑render) – **Medium** → aligns with Performance PF‑001.
- **RF‑003** (Legacy SCSS) – **Low** → already captured in Technical Debt.

**Sprint 4.5 Recommendation:** focus on the items flagged **Critical/High** in the sections above; backlog entries will be updated accordingly during sprint planning.

---

## 7. Recommendations Summary for Sprint 4.5
| Category | Item | Severity | Reason to Include |
|----------|------|----------|-------------------|
| Technical Debt | `src/styles/main.scss` (global coupling) | **Critical** | Prevents clean separation of shell/page/component layers, a core UI modernization goal. |
| Technical Debt | `src/styles/main.scss` (dark‑theme values) | **High** | Blocks consistent dark‑mode theming. |
| Technical Debt | `src/styles/theme.scss` (hard‑coded colors) | **High** | Stops full token‑based theming. |
| Performance | Bundle size (`src/assets/bundle.js`) | **Critical** | Large bundle degrades load performance on target devices. |
| Test Gaps | TG‑004 (9 layout regression gaps) | **Critical** | Provides safety net for the newly tokenized layout. |
| Test Gaps | TG‑001 (column ordering regression) | **High** | Specific high‑risk layout change. |
| Component Cleanup | CC‑001 (duplicate OldButton) | **Medium** | Reduces component churn, aligns with UI consistency. |
| Performance | PF‑002 (bundle size) | **High** | Improves perceived performance for end users. |
| Technical Debt | Sidebar toggle (low impact) – can be deferred. |
| Technical Debt | Header inline JSX – can be deferred. |

All other items are **Low/Medium** and can be scheduled for later sprints.

---

**Next Steps**
1. Add the above items to `REFACTORING_BACKLOG.md` with **Priority** set to *Critical* or *High* as indicated.
2. Assign owners (Frontend Lead, QA Lead, etc.) and move status to **Planned** for Sprint 4.5.
3. During sprint planning, ensure the critical items are allocated sufficient capacity.

---

*Document authored by Antigravity (AGY) on 2026‑08‑02.*
