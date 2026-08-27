# Performance

This document records performance‑related observations uncovered during implementation sprints. Use the table below to capture rendering bottlenecks, bundle size concerns, unnecessary re‑renders, lazy‑loading gaps, and memoisation opportunities.

---

## Performance Issues Table

| ID | Sprint | File / Component | Issue Type | Description | Impact | Suggested Fix | Owner | Status |
|----|--------|------------------|------------|-------------|--------|---------------|-------|--------|
| PF-001 | Sprint 1 | `src/pages/Dashboard.tsx` | Rendering Issue | Component re‑renders on every global store update | High CPU usage on busy pages | Wrap with `React.memo` and use selector hooks | Frontend Lead | Open |
| PF-002 | Sprint 2 | `src/assets/bundle.js` | Bundle Size | Bundle exceeds 1.5 MB (gzip) | Slower initial load on mobile | Enable code‑splitting and lazy‑load heavy libs | Frontend Lead | Open |
| PF-003 | Sprint 2 | `src/components/Chart.jsx` | Re‑render | Chart re‑draws on unrelated state changes | Jank during interaction | Use `useMemo` for data processing and `React.memo` for component | Frontend Lead | Open |

---

## How to Add a New Entry
1. Generate a unique **ID** (`PF-XXX`).
2. Choose **Issue Type** from: `Rendering Issue`, `Bundle Size`, `Re‑render`, `Lazy Loading`, `Memoization`.
3. Fill **Impact**, **Suggested Fix**, and assign an **Owner**.
4. Set **Status** according to definitions in `README.md`.

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026‑08‑01 | Antigravity (AGY) | Created Performance template |
