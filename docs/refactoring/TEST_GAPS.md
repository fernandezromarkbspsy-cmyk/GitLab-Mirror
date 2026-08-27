# Test Gaps

This document logs gaps in test coverage discovered during implementation sprints. It includes missing CRG‑generated tests, regression tests, integration tests, and component tests.

---

## Test Gaps Table

| ID | Sprint | Area | Gap Type | Description | Impact | Recommendation | Owner | Status |
|----|--------|------|----------|-------------|--------|----------------|-------|--------|
| TG-001 | Sprint 2 | Layout | Missing Regression Test | Layout changes to `OrderList` page have no regression test covering column ordering | Risk of UI regression in production | Add a Cypress regression test for column order after layout changes | QA Lead | Open |
| TG-002 | Sprint 2 | Component | Missing Unit Test | `src/components/FilterBar.tsx` lacks unit tests for filter logic | Reduces confidence in filter behavior | Create Jest unit tests covering all filter combinations | QA Lead | Open |
| TG-003 | Sprint 2 | CRG | Missing CRG Test | No CRG test for `src/services/api.ts` error handling paths | Undetected API failure scenarios | Add CRG test cases for error branches | QA Lead | Open |
| TG-004 | Sprint 2 | Layout | Missing Regression Tests | Multiple layout‑related UI elements lack regression coverage (9 gaps) | Increased risk of UI regressions in production | Add comprehensive Cypress regression suite covering shell, page, and component layout changes | QA Lead | Open |

---

## How to Add a New Gap Entry
1. Assign a unique **ID** (`TG-XXX`).
2. Specify **Sprint**, **Area** (Layout, Component, CRG, Integration, etc.).
3. Choose **Gap Type** from the list above.
4. Fill **Description**, **Impact**, **Recommendation**, and **Owner**.
5. Set **Status** as per `README.md` definitions.

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026‑08‑01 | Antigravity (AGY) | Created Test Gaps template with Sprint 2 layout gap entry |
