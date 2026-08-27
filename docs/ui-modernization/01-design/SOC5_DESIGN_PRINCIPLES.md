# SOC5-OUTBOUND: UI DESIGN PRINCIPLES

This document is the single source of truth governing all frontend implementation decisions for the SOC5-Outbound UI modernization project.

---

## 1. Project Vision
To transform the SOC5-Outbound interface into a high-performance, enterprise-grade prospecting engine that empowers users with rapid, insight-driven workflows.

## 2. Design Philosophy
Modern, high-density, purposeful enterprise design. Every pixel exists to facilitate action.

## 3. UI Modernization Goals
- Increase operational velocity.
- Enhance data discoverability.
- Establish a scalable, maintainable component library.
- Achieve visual parity with modern enterprise standards (Pivora-inspired).

## 4. User Experience Principles
- **Action-Oriented:** Prioritize task execution paths.
- **Context-Aware:** Display only relevant data for the current prospect/campaign scope.
- **Consistency:** Uniform behaviors across all modules.

## 5. Enterprise Dashboard Principles
- **Insight-First:** KPI cards above everything else.
- **Modular Widgets:** Allow user-customized views.

## 6. Information Density Guidelines
- Purposeful density. Use spacing (8px grid) to separate related functional groupings without creating visual clutter.

## 7. Visual Hierarchy Rules
- Strict: Navigation > KPIs > Primary Data > Contextual Widgets.

## 8. Layout Principles
- 12-column grid-based, card-centric modularity.

## 9. Navigation Principles
- Icon-heavy sidebar, contextual header for active campaign switching.

## 10. KPI Card Principles
- Headline + Trend Indicator + Contextual Label.

## 11. Table Design Principles
- Sticky header, bulk-action capable, sortable/filterable.

## 12. Form Design Principles
- Immediate validation, high-contrast labels, rounded input fields.

## 13. Dialog & Drawer Principles
- Dialogs for destructive/major actions; Drawers for contextual drill-downs.

## 14. Status & Badge Principles
- Semantic color palette; clear distinction between temporary status (pills) and counts (badges).

## 15. Typography Principles
- Legibility at scale. Bold monospaced values for data.

## 16. Color Principles
- Pivora-inspired palette: Neutral light grey background, white surface cards, primary purple accent.

## 17. Iconography Guidelines
- Consistent stroke-weight, minimalist icon set.

## 18. Spacing Principles
- Strictly 8px grid foundation.

## 19. Responsive Design Principles
- Desktop-first, fluid layout that collapses to vertical stacks on smaller viewports.

## 20. Accessibility Principles
- WCAG 2.1 AA compliance, keyboard navigation, high contrast.

## 21. Motion & Animation Principles
- Subtle, functional, no "slop". Transitions for context changes only.

## 22. Loading & Empty State Principles
- Skeleton screens for data loading; clear, actionable CTAs for empty states.

## 23. Error State Principles
- Non-intrusive, clear resolution instructions.

## 24. Component Reusability Principles
- Composition over duplication. Every UI element must be a reusable component.

## 25. Performance-Oriented UI Principles
- Minimize main-thread blocking, prioritize initial paint of KPI/Action areas.

---

## Non-Negotiable Rules
- **Preserve:** Business logic, APIs, routing, authentication, state management.
- **Adapt:** Visual language only from Pivora.
- **Avoid:** No CRM-specific workflows or terminology.
- **Prioritize:** Desktop-first, maintain operational efficiency on smaller screens, reusable components over duplication, consistency over experimentation.

---

## Definition of Success
A successful modernization results in a UI that feels responsive, unified, and highly efficient for prospecting workflows, with 100% component-based architecture ensuring future maintainability and zero performance regression.
