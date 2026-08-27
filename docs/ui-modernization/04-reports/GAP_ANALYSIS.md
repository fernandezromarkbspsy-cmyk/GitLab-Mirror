# GAP ANALYSIS: SOC5-OUTBOUND MODERNIZATION

This document maps the delta between the current frontend implementation and the target design specifications established in the modernization documentation.

---

## 1. Component Gap Overview

| Area | Current State | Target State | Complexity | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **App Layout** | Custom CSS/Hardcoded | Token-driven Grid | Medium | High |
| **Sidebar** | Functional, Outdated | Pivora-inspired (Tokens) | High | High |
| **Header** | Functional, Outdated | Pivora-inspired (Tokens) | High | High |
| **Dashboard** | Static/Tight Coupling | Modular Widgets | High | High |
| **KPI Cards** | Minimalist/Static | Data-dense/Trend-aware | Medium | High |
| **Tables** | Feature-rich/Unstyled | Token-styled/Modern | Medium | Medium |
| **Forms/Inputs** | Standard HTML | Token-styled/Validated | Medium | Medium |
| **Buttons** | Custom SASS | Token-driven/Standard | Low | High |
| **Typography** | Mixed/Hardcoded | Token-driven (Inter) | Medium | High |
| **Colors** | Hardcoded Hexes | Token-driven (Semantic) | High | High |
| **Design Tokens** | None | Full Adoption | High | High |
| **Accessibility** | ARIA-base | Full WCAG 2.1 AA | Medium | Medium |

---

## 2. Executive Summary
The gap between current and target state is **foundational**. The current UI lacks a token system entirely, relying on hardcoded SASS classes. Closing these gaps requires moving from *component-by-component styling* to *centralized token management* and *reusable component composition*.

---

## 3. Top 20 Modernization Tasks
1. Define & export CSS custom property tokens.
2. Replace hardcoded background/surface colors with `--color-bg-base`/`--color-surface`.
3. Standardize button components (Primary/Secondary).
4. Rebuild AppSidebar with tokenized styles.
5. Rebuild AppHeader with tokenized styles.
6. Standardize typography scale across all pages.
7. Implement 8px grid spacing system globally.
8. Modernize KPI Card component.
9. Implement skeleton loading for all data-heavy components.
10. Refactor Data Table to use semantic colors/borders.
11. Standardize form input styles (Radius/Focus).
12. Build reusable Status Pill component.
13. Implement responsive stacking rules (mobile-first behavior).
14. Audit and standardize focus states.
15. Standardize empty state UI.
16. Implement consistent modal backdrops.
17. Migrate icons to standardized sizing.
18. Standardize transition durations (Motion tokens).
19. Refactor dashboard charts to match Pivora visual language.
20. Centralize Z-index management.

---

## 4. Quick Wins
- Standardize all buttons to use the primary accent color.
- Migrate typography to a single font family ('Inter').
- Apply basic border radius tokens to all card/input elements.
- Implement standardized spacing (8px grid) on the main dashboard container.

---

## 5. Implementation Sequence
1. **Foundation (Immediate):** Tokens and CSS Variable setup.
2. **Framework (Phase 1):** Layout, Sidebar, Header.
3. **Data/Action (Phase 2):** KPI Cards, Buttons, Tables.
4. **Refinement (Phase 3):** Forms, Modals, Empty States, Responsive tuning.

*Analysis finalized: August 1, 2026.*
