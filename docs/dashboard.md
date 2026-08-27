Dashboard frontend UI and data design
The dashboard is a client-rendered operational overview for linehaul truck requests. It combines authentication-aware navigation, summary metrics, charts, notifications, and a paginated request table.
1. Page composition
Both / and /dashboard render the same dashboard:
/ is implemented in [app/page.tsx](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/app/page.tsx)
/dashboard re-exports / through [app/dashboard/page.tsx](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/app/dashboard/page.tsx)
The visual hierarchy is:
RoleGuard
└── Application shell
    ├── Sidebar                    desktop, ≥1024px
    └── Main content
        ├── Fixed header
        │   ├── Mobile navigation
        │   ├── Page title
        │   ├── Date selector
        │   ├── Request search
        │   ├── Notifications
        │   ├── More menu
        │   └── User/profile menu
        └── Dashboard body
            ├── Four statistic cards
            ├── Hourly request chart
            ├── Truck-size donut chart
            └── Paginated request table
The main content orchestration is in [dashboard-content.tsx](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/components/dashboard/dashboard-content.tsx).
2. Application shell and access control
RoleGuard fetches the current session from /api/auth/me.
While checking authentication, it displays a centered loading card. If authentication fails, it redirects to /login.
The dashboard does not pass a specific role list, so every authenticated role can see the overview:
ops_pic
fte_ops
fte_mm
doc_officer
dock_officer
See [role-guard.tsx](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/components/auth/role-guard.tsx) and [domain.ts](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/lib/domain.ts).
3. Sidebar information architecture
The desktop sidebar is fixed at 256px wide. It disappears below the lg breakpoint and becomes a slide-out mobile sheet.
Navigation visibility depends on the current role:
Area	Page	Allowed roles
Overview	Dashboard	All authenticated users
Outbound	LH Request	ops_pic, fte_ops
Midmile	Truck Request	fte_mm
Docking	Docking Confirmation	doc_officer, dock_officer
KPI	Analytics	fte_ops
User Management	Team	fte_ops, fte_mm
Settings, Help, Logout	General	All users

Outbound, Midmile, and Docking are collapsible groups. The active page receives a solid green background, while hover interactions translate inactive links slightly to the right.
See [sidebar.tsx](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/components/dashboard/sidebar.tsx).
4. Header design
The header is fixed at the top and offset by the sidebar on desktop. It contains:
Dashboard title
Date-range selector
Global LH-request search
Notification dropdown
Secondary navigation menu
Profile and role-switching menu
Date-range selector
The dashboard initializes both dates to today in the browser’s local timezone.
Users can:
Open a two-month range calendar
Choose a start and end date
Reset both values to today
The selected range is passed only to StatsCards.
Search
Search text is stored globally in Zustand:
{
  search: string
  setSearch(search)
}
Submitting the search redirects to /outbound/lh-request, where the shared search value can be applied to the request UI. Ctrl+F or Cmd+F is intercepted to focus this input instead of opening the browser’s native find interface.
Notifications
Notifications come from /api/notifications.
The dropdown shows:
Unread count
Up to six notifications
Read/unread indicator
Mark-one-as-read behavior
Mark-all-as-read behavior
The profile area displays the current user’s name and role. An fte_ops administrator can temporarily switch into another role view.
See [header.tsx](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/components/dashboard/header.tsx), [role-switcher.tsx](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/components/dashboard/role-switcher.tsx), and [store.ts](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/lib/store.ts).
5. Dashboard request data model
The central frontend object is ApiRequest:
type ApiRequest = {
  id: string
  cluster: string
  region: string
  dock_no: string | null
  backlogs: number
  backlogs_timestamp: string | null
  ob_fte: string | null
  ob_ops_pic: string | null
  midmile_fte: string | null
  truck_size: "4W" | "6W" | "10W" | "6WF"
  truck_type: "WETLEASE" | "DRYLEASE"
  plate_number: string | null
  provide_time: string | null
  linehaul_trip_no: string | null
  driver_id: string | null
  request_timestamp: string
  status: RequestStatus
}
Supported statuses are:
PENDING
APPROVED
CANCELLED
REJECTED_BY_MM
ASSIGNED
FOR_DOCKING
DOCKED
CONFIRMED
The API returns:
{
  data: ApiRequest[]
  total: number
  page: number
  limit: number
}
Requests are ordered by database created_at DESC, meaning newest created records appear first.
See [api.ts](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/lib/api.ts).
6. Statistic cards
The first dashboard row contains four responsive cards:
Card	Calculation
Total Request	Every request within the selected dates
Pending Request	Date-matched requests with PENDING status
For Docking	Date-matched requests with FOR_DOCKING status
Docked	Date-matched requests with DOCKED status

The date filter compares the local calendar date derived from request_timestamp.
The first card is visually emphasized with a solid primary-green background. The remaining cards use white/card backgrounds.
Each card is keyboard-accessible and clickable. Opening one displays a detail dialog containing:
Short request ID
Cluster
Region
Status
Truck size and lease type
Plate number
Request time
See [stats-cards.tsx](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/components/dashboard/stats-cards.tsx).
7. Hourly truck-request chart
The main chart represents the current operational night shift:
6:00 PM → 6:00 AM
If the current time is before 6:00 AM, the shift starts at 6:00 PM on the previous calendar day.
The frontend creates 13 hourly points labeled:
6PM, 7PM, ... 11PM, 12AM, ... 6AM
Each bucket counts requests whose request_timestamp falls within that hour.
The card also calculates:
Total requests during the shift
Peak hourly count
Hour at which the peak occurred
The visualization uses Recharts with:
Green line
Light area fill
Dashed horizontal grid
Hover tooltip
Highlighted active point
See [project-analytics.tsx](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/components/dashboard/project-analytics.tsx).
8. Truck-size analytics
The donut chart groups requests by:
4W
6W
10W
6WF
The center shows the total number of loaded requests. The legend shows the count and rounded percentage for each size.
The shades progress from dark emerald to pale green, preserving the dashboard’s single-color visual identity.
See [truck-size-chart.tsx](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/components/dashboard/truck-size-chart.tsx).
9. All Requests table
The table is server-paginated at 50 rows per page.
Columns are:
Column	Source
Request	Truncated uppercase id, plus truck_type
Requested	Local date and time from request_timestamp
Route	cluster and region
Status	Status badge
Truck Details	truck_size and plate_number
Dock	dock_no
Backlogs	Numeric backlogs

Status badges use semantic colors:
Pending: amber
Approved: blue
Cancelled: slate
Rejected: red
Assigned: violet
For Docking: cyan
Docked/Confirmed: emerald or green
Additional behavior includes:
Sticky column headers
Sticky first column during horizontal scrolling
Maximum 720px internal scroll area
Loading skeleton rows
Empty state
Previous/next pagination
Reduced opacity while another page loads
Smooth scrolling back to the table after changing pages
See [recent-requests-table.tsx](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/components/dashboard/recent-requests-table.tsx).
10. Data-fetching and cache design
TanStack Query manages server state.
Global defaults are:
queries: {
  staleTime: 10_000,
  refetchInterval: 15_000,
  retry: 1
}
mutations: {
  retry: 0
}
Therefore normal dashboard queries:
Remain fresh for 10 seconds
Poll every 15 seconds
Retry one failed read
Request queries are separated by purpose:
["requests"]
["requests", "dashboard", page]
The first query feeds summary cards and charts. The second feeds individual table pages.
Notifications poll more frequently—every five seconds. When new notifications arrive, the application:
Displays a toast
Plays a short alert sound
Invalidates request, KPI, and user caches
See [providers.tsx](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/components/providers.tsx) and [notification-listener.tsx](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/components/notification-listener.tsx).
11. Visual design system
The interface uses:
Tailwind CSS 4
shadcn/Radix UI primitives
Lucide icons
Recharts
CSS variables using OKLCH colors
The visual identity is green and operational:
Pale green-tinted page background
White cards
Deep green primary actions
Emerald chart series
Large rounded cards
Subtle borders and shadows
Hover elevation
Semantic status colors
Both light and dark themes are defined. Theme selection is persisted under tasko-theme.
The base corner radius is 1rem, producing relatively rounded cards and panels.
See [globals.css](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/app/globals.css).
12. Responsive behavior
The layout adapts across three primary breakpoints:
Mobile: one-column content, slide-out navigation, hidden search and date selector
Tablet: two-column statistic cards
Desktop: four statistic cards, fixed sidebar, two-thirds/one-third chart layout
The analytics section changes from:
Mobile:
Hourly chart
Truck-size chart
to:
Desktop:
┌──────────────────────────┬─────────────┐
│ Hourly request chart     │ Truck sizes │
│ 2/3 width                │ 1/3 width   │
└──────────────────────────┴─────────────┘
The request table remains usable on small screens through internal horizontal scrolling and sticky identifiers.
13. Relationship to the user seed file
The active [users-seed.sql](C:/Users/spxph4227/Desktop/tasko-modern-task-management-bv/docs/outbound/users-seed.sql) does not directly populate dashboard metrics.
It supplies:
User identity
Role
Email or OPS ID
FTE status
Account status
Clerk linkage information
That data controls:
Who can log in
Which sidebar sections are visible
Which user name and role appear in the header
Whether role switching is available
Which notifications a user receives
The actual cards, charts, and table are populated from the requests table through /api/requests.
14. Important design limitations
There are several material inconsistencies in the current implementation:
The date selector only filters statistic cards.
It does not affect the hourly chart, truck-size chart, or request table.

Cards and charts only load the latest 100 requests.
api.requests() requests 100 records, which is also the backend maximum. Consequently, “Total Request” is not truly total when more than 100 matching records exist.

The truck-size chart has no date or shift filter.
It represents the latest loaded request page, not a defined reporting period.

Different widgets use different datasets.
Cards/charts use the shared latest-100 query, while the table uses server pagination and its accurate total.

Search is navigation-oriented.
The dashboard search does not filter the dashboard itself; it transfers the search context to the LH Request page.

There are encoding artifacts in several labels.
Characters intended as em dashes and middle dots appear in source output as â€”, Â·, and similar sequences. These should be normalized to UTF-8.

The visual design is coherent, but the analytical meaning is only partially coherent because filters and data scopes are not shared across widgets.