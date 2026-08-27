# Legacy Cleanup

This document tracks the removal of legacy UI artifacts (SCSS, CSS, components, imports, wrappers) after each implementation sprint.

---

## Sprint Cleanup Summary

| Sprint | Legacy SCSS Removed | Legacy CSS Removed | Deprecated Components Removed | Unused Imports Removed | Obsolete Wrappers Removed |
|--------|--------------------|--------------------|------------------------------|------------------------|----------------------------|
| Sprint 1 | `src/styles/legacy.scss` | `src/styles/old-reset.css` | `OldButton`, `LegacyCard` | `import "legacy-utils"` | `LegacyWrapper` |
| Sprint 2 | *To be filled* | *To be filled* | *To be filled* | *To be filled* | *To be filled* |

---

## Detailed Cleanup Table

| ID | Sprint | Asset Type | Path / Identifier | Reason for Removal | Owner | Status |
|----|--------|------------|-------------------|--------------------|-------|--------|
| LC-001 | Sprint 1 | SCSS | `src/styles/legacy.scss` | Replaced by new `base/` styles | Frontend Lead | Completed |
| LC-002 | Sprint 1 | Component | `src/components/OldButton.tsx` | Duplicate of modern Button component | Frontend Lead | Completed |
| LC-003 | Sprint 1 | Import | `src/utils/legacy-utils.ts` | No longer used after refactor | Frontend Lead | Completed |

---

## How to Add a New Cleanup Entry
1. Use a new **ID** (`LC-XXX`).
2. Indicate the **Sprint** and **Asset Type** (Legacy SCSS, Legacy CSS, Deprecated Component, Unused Import, Obsolete Wrapper).
3. Provide the **Path / Identifier**, **Reason for Removal**, and **Owner**.
4. Set **Status** (`Open`, `Planned`, `In Progress`, `Completed`, `Deferred`).

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026‑08‑01 | Antigravity (AGY) | Created Legacy Cleanup template |
