# FRONTEND ARCHITECTURE AUDIT: SOC5-OUTBOUND

## 1. Overall Frontend Architecture
The frontend is a React-based SPA structured around functional modules in `src/pages` and `src/components`. State management is decentralized, relying on component-local state and props, with API-driven data fetching.

## 2. Folder Structure
- `frontend/src/pages/`: Page-level components.
- `frontend/src/components/`: Reusable UI components.
- `frontend/src/lib/`: API utilities and helper functions.
- `frontend/src/hooks/`: Custom React hooks.
- `frontend/src/stores/`: State management stores.

## 3. Page Inventory (Total: 9)
| Page | Role | Modernization |
| :--- | :--- | :--- |
| `Overview.tsx` | Main Prospecting View | Replace |
| `OutboundRequests.tsx`| Campaign Lead Management | Replace |
| `MidmileRequests.tsx` | Workflow Management | Refactor |
| `Dashboard.tsx` | System Dashboard | Refactor |
| `DockingConfirmation.tsx`| Action Confirmation | Refactor |
| `Kpi.tsx` | Metrics Detail | Refactor |
| `UserManagement.tsx` | User Admin | Refactor |
| `Login.tsx` | Authentication | Reuse |
| `ChangePassword.tsx` | Security | Reuse |

## 4. Reusable Components (Total: 11)
| Component | Status | Priority |
| :--- | :--- | :--- |
| `AppHeader.tsx` | Replace | High |
| `AppSidebar.tsx` | Replace | High |
| `RequestTable.tsx` | Replace | High |
| `RequestFilters.tsx` | Refactor | High |
| `Modal.tsx` | Refactor | Medium |
| `Pagination.tsx` | Refactor | Medium |
| `StatusBadge.tsx` | Refactor | Medium |
| `SkeletonTable.tsx` | Refactor | Medium |
| `ColumnVisibilityMenu.tsx`| Refactor | Medium |
| `PrintableTruckLabel.tsx` | Refactor | Low |
| `ErrorBoundary.tsx` | Reuse | Low |

## 5. Architectural Findings
- **High Debt:** The `pages-submit` (pages) and `lib-request` (API) communities are highly coupled.
- **Design Debt:** Components directly utilize hardcoded styles; minimal reusable token usage.
- **Modernization Order:** 
  1. Core Layout (`AppHeader`, `AppSidebar`) to establish the new framework.
  2. Main Prospecting View (`Overview`, `OutboundRequests`) for high-impact improvements.
  3. Supporting data-heavy pages and components.

---
*Audit completed: August 1, 2026.*
