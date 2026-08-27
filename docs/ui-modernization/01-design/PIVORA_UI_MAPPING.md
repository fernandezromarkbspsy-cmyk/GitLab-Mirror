# PIVORA UI MAPPING: SOC5-Outbound Adaptation

This document maps the components of the Pivora CRM design system to the functional requirements of the SOC5-Outbound platform.

| Pivora Component | SOC5-Outbound Equivalent | Purpose | Design Intent | Adaptation Strategy | UX Notes | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Sidebar** | Navigation Sidebar | Global Navigation | Consistent access | Map to Outbound workflows | Collapsible, icon-heavy | High |
| **Header** | Contextual Header | Global Context | Quick actions/Search | Add Campaign Selector | Minimalist | High |
| **Dashboard** | Prospecting Dashboard | Overview | Insight-first view | Grid-based widgets | Responsive stack | High |
| **KPI Cards** | Outreach Metric Cards | Performance Tracking | Instant status | Adapt to Outreach KPIs | Trend indicators | High |
| **Charts** | Activity/Conversion Charts | Data Visualization | Trend analysis | High-contrast visuals | Skeletal loading | Medium |
| **Tables** | Lead Management Table | Data Management | List exploration | Column sorting/filtering | Bulk action bar | High |
| **Filters** | Outreach Filters | Data Reduction | Focused exploration | Campaign/Status based | Persistent UI | High |
| **Search** | Global Lead Search | Retrieval | Rapid access | Lead/Campaign search | Instant results | Medium |
| **Status Pills** | Lead Status Pill | Visualization | Quick recognition | Use CRM color palette | Semantic colors | Medium |
| **Badges** | Count Badge | Notification | Alerting | Outreach counts | Distinct from Pills | Low |
| **Dialogs** | Action Modal | Confirmation/Input | Focused interaction | Standardize sizes | Backdrop overlay | Medium |
| **Drawers** | Prospect Details Panel | Contextual Info | Detail expansion | Right-side placement | Non-blocking | Medium |
| **Forms** | Campaign/Lead Form | Data Entry | structured input | Immediate validation | High-contrast labels | High |
| **Buttons** | Action Buttons | Execution | Primary/Action triggers | Accent purple for primary | Hover states | High |
| **Navigation** | Breadcrumb/Tabs | Hierarchy | Context tracking | Campaign context | Clear pathing | Medium |
| **Notifications** | Alert Tray | Status Updates | Timely feedback | System events | Unobtrusive | Low |
| **Activity Timeline** | Lead Activity Log | History tracking | Audit/Context | Outreach history | Vertical layout | Medium |
| **Empty States** | No Data State | User Guidance | Help/Onboarding | Encouraging CTAs | Visual-driven | Low |
| **Loading States** | Skeleton Screen | UX Feedback | Reduce latency | Skeleton UI | Smoothened fade | Medium |
| **User Profile** | Account Menu | Access/Settings | Account management | Same system footer | Dropdown action | Low |
| **Quick Actions** | Contextual Menu | Speed | Workflow efficiency | Hover-triggered | High accessibility | Medium |

---
## Implementation Considerations

1.  **Design Consistency:** All components must adhere strictly to the token definitions established in the Design Analysis (8px grid, specific radii, color palette).
2.  **Adaptation:** The core priority is replacing CRM business logic with Outbound prospecting logic (e.g., mapping "Leads" in CRM to "Prospects" in Outbound, "Deals" to "Campaigns").
3.  **Performance:** Skeleton screens are critical to maintaining the "insight-first" feel during data fetching for larger prospect lists.
4.  **Priority:** Sidebar, Header, KPI Cards, and Tables form the Minimum Viable UI.

*Mapping finalized: August 1, 2026.*
