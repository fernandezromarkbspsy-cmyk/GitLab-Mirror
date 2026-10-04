# Refactoring Backlog

## CSS Migration Override Consolidation

- **Category:** CSS maintainability
- **Priority:** Medium
- **Sprint discovered:** CSS duplication audit (2026-10-04)
- **Recommendation:** Review the remaining repeated selector contexts in `frontend/src/styles/template-migration.css`. Consolidate only overrides whose computed styles can be preserved, and validate affected desktop, tablet, mobile, and reduced-motion states before moving declarations across sections.
- **Status:** Open
