# Component Cleanup

This document tracks duplicate, obsolete, or legacy UI components discovered during implementation.

---

## Cleanup Table

| ID | Sprint | Component Path | Issue Type | Description | Impact | Recommendation | Owner | Status |
|----|--------|----------------|------------|-------------|--------|----------------|-------|--------|
| CC-001 | Sprint 1 | `src/components/OldButton.tsx` | Duplicate | Same functionality as `Button.tsx` | Increased maintenance burden | Remove `OldButton` and replace imports with `Button` | Frontend Lead | Open |
| CC-002 | Sprint 2 | `src/components/Wrapper/LegacyWrapper.tsx` | Obsolete Wrapper | No longer needed after CSS refactor | Redundant DOM node | Delete file and update usage | Frontend Lead | Open |

---

## How to Add an Entry
1. Assign a unique **ID** (`CC-XXX`).
2. Provide **Sprint**, **Component Path**, **Issue Type** (Duplicate, Obsolete Wrapper, Legacy Utility, Inline Style, Deprecated UI Element).
3. Fill **Description**, **Impact**, **Recommendation**, and **Owner**.
4. Set **Status** using definitions from `README.md`.

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026‑08‑01 | Antigravity (AGY) | Created component cleanup template |
