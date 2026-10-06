I’ll use the Watermelon UI MCP catalog and inspect the existing components to build a migration plan grounded in both—without changing the app yet.

Copy
Thumbs up
Thumbs down
Share snapshot
Oct 6, 2026, 1:21 PM

Thought process
Recommendation: migrate the UI, preserve the application logic
I checked the Watermelon UI MCP catalog and your frontend. The safest approach is to rebuild the presentation of Dashboard, AppSidebar, and AppHeader incrementally—not replace the application with a dashboard template.

Scope assumption: by “projects dashboard,” I’m treating this as the dashboard in this project. The repository contains an SOC 5 outbound operations dashboard, not a separate Projects page.

Watermelon references



Surface	Reference	How to use it
Shared app shell	Agndex Dashboard	Adapt its sidebar/content structure and compact topbar
AppHeader	Navigation-4	Borrow search and account-menu patterns—not its marketing navigation
Dashboard content	Library Dashboard	Catalog-level reference for metrics, charts, and operational panels; implementation source remains unverified
The MCP’s automatic page composer returned unrelated error-page blocks, so I excluded those recommendations.

Migration plan
1. Establish the shared foundation
Keep React 19, Vite, React Router, TanStack Query, Zustand, and existing API contracts.
Retain SOC 5 branding: Manrope typography, dark sidebar, lime accents, neutral content surfaces.
Define shared shell dimensions and layering instead of repeating sidebar offsets in multiple components.
Audit registry dependencies before importing anything. Your existing Button only supports default and ghost; Watermelon sources also expect buttonVariants, other variants, and asChild.
Add only needed primitives—such as Sheet, DropdownMenu, Tooltip, and Sidebar—without blindly overwriting existing UI files.
2. Migrate AppSidebar
Target: grouped navigation, clearer active states, readable labels, and an accessible mobile drawer.

Preserve:

Role-specific Outbound, Midmile, Docking, KPI, and User Management visibility.
Pending-count badges, automatic group expansion, navigation callbacks, and sign-out.
Closing navigation after selection and returning focus to the opener.
Improve:

Use one navigation configuration shared with route visibility checks.
Add aria-current to the active destination.
Replace the custom mobile scrim with an accessible drawer, including Escape dismissal and focus restoration.
Avoid adding motion/icon dependencies solely for the macOS sidebar aesthetic.
3. Migrate AppHeader
Target: compact breadcrumb/title area, request search, date filters, notifications, and admin role controls.

Preserve:

Search state and Enter-to-search navigation.
Date-range actions.
Notification queries, realtime recovery, unread counts, and mark-read mutations.
Admin-only role preview.
Improve:

Separate notification/data behavior from visual header components.
Use accessible menus/popovers rather than manual outside-click handling.
Replace z-99999 and duplicated fixed offsets with a documented layering scheme.
Make search usable on narrow screens; retain existing shortcut behavior during migration.
4. Rebuild dashboard presentation
Update Dashboard.tsx, Overview.tsx, and the existing dashboard components while retaining their data logic:

Total Requests, Pending Requests, Awaiting Docking, and Completed scorecards.
Intraday dispatch chart, truck mix, trips, assigned trucks, and queue previews.
Metric drill-downs, filters, loading states, and realtime updates.
Explicit empty/error states so unavailable data is not mistaken for zero activity.
Do not import Agndex’s demo router, theme provider, sample data, or project-switching behavior. Its MCP source also returned empty sidebar/icon files, so it is not yet a verified drop-in replacement.

Rollout and acceptance
Implement in this order: foundation → sidebar → header → overview → cleanup, with separately reviewable changes.

Before retiring the old UI:

Verify every role and route, including direct URLs and browser back/forward.
Test mobile drawer keyboard behavior and header actions.
Run build, unit tests, accessibility checks, and responsive-shell tests.
Preserve the existing desktop scorecard composition unless intentionally redesigned; its current test explicitly checks a roughly 40% metrics / 60% intraday split.
Update brittle CSS-class assertions to test user-visible behavior where the implementation changes.
Completed: repository inspection and Watermelon-backed migration planning. No app files changed, registry packages installed, or runtime tests run.

Copy
Thumbs up
Thumbs down
Share snapshot
Oct 6, 2026, 1:21 PM
i will be using npx shadcn@latest add https://registry.watermelon.sh/r/tallie-dashboard.json

Copy
Oct 6, 2026, 1:22 PM

Thought process
Understood—Tallie Dashboard will be the single visual foundation, replacing the earlier Agndex/Navigation-4 references.

I checked Tallie through the Watermelon UI MCP. Its layout provides an expanded 18.125rem sidebar, a 4.25rem collapsed rail, and an in-flow header with a scrollable content area.

Run your selected command from the frontend directory, where components.json lives:

bash


cd frontend
npx shadcn@latest add https://registry.watermelon.sh/r/tallie-dashboard.json
Review any overwrite prompts carefully. Tallie requires button, dropdown-menu, input-group, sheet, sidebar, table, and utils. Your existing Button is not API-compatible with Tallie’s buttonVariants, outline, and icon-lg usage.

Revised migration plan



Target	Tallie foundation	Application behavior to retain
Dashboard.tsx	dashboard-layout.tsx and SidebarProvider	Route handling, permissions, lazy-loaded pages, realtime hooks
AppSidebar.tsx	Tallie sidebar structure and collapsed navigation	SOC 5 menu groups, role visibility, pending badges, sign-out
AppHeader.tsx	Tallie topbar, responsive search, dropdowns	Request search, date filters, live notifications, admin role preview
Overview.tsx	Tallie dashboard presentation	Operational scorecards, intraday chart, truck mix, queues, drill-downs
Implementation order
Install and review the generated diff—especially shared primitives, dependencies, and CSS.
Adapt the shell first. Remove the old fixed sidebar margins and header offsets when adopting Tallie’s in-flow layout; don’t run both positioning systems together.
Connect the sidebar to existing routes and roles. Replace Tallie’s local demo navigation with React Router.
Connect the header to real state. Replace demo user/notifications and local search state with the existing user, TanStack Query, realtime, and Zustand behavior.
Restyle the overview without changing business calculations or API contracts.
Verify roles, mobile/collapsed navigation, filters, notifications, and responsive layout.
Important boundaries
Do not mount TallieDashboardDemo as the production app: its router uses local state, and several demo destinations intentionally render blank content.
Do not carry over expense-audit labels, transaction fixtures, billing links, or fabricated trends.
Tallie CSS introduces Geist fonts, theme tokens, and body-level portal selectors. Review their effect on existing pages before enabling them globally.
The MCP returned empty dashboard-page/icon source and incomplete sidebar source. Inspect the installed files before treating those components as complete.
The plan is now Tallie-based. No installation or application changes have been made by me.

Copy
Thumbs up
Thumbs down
Share snapshot
Oct 6, 2026, 1:22 PM
for sidebar we will apply: npx shadcn@latest add https://registry.watermelon.sh/r/medesk-dashboard.json

provide setup guide to fully copy and replicate medesk-dashboard.json sidebar

Copy
Oct 6, 2026, 1:28 PM

Thought process
Setup guide: replicate the Medesk sidebar
Use Medesk for the sidebar and keep Tallie for the dashboard/header. First reproduce the Medesk sidebar unchanged in an isolated preview, then connect it to your application.

I inspected the Medesk source through the Watermelon UI MCP. Its sidebar includes:

Expanded width: 17.25rem / 276px
Collapsed width: 5.125rem / 82px
Collapsible navigation groups
Icon-only mode with tooltips
Header collapse/expand button and sidebar rail
Account dropdown, avatar, and theme switch
Mobile navigation through the shared Sidebar primitive
Source limitation: the MCP returned the full sidebar but empty icon source. A direct registry fetch was blocked by the workspace snapshot limit, so verify the installed icons.tsx before proceeding.

1. Install from the frontend directory
Create a clean Git checkpoint first so shared-component changes are easy to review.

bash


cd frontend
npx shadcn@latest add https://registry.watermelon.sh/r/medesk-dashboard.json
This installs the whole Medesk dashboard, not only its sidebar.

Review overwrite prompts instead of automatically accepting all changes. The registry declares these shared dependencies:

text


avatar
button
collapsible
dropdown-menu
input-group
sheet
sidebar
utils
It also declares Lucide, Recharts, and Geist/Geist Mono/Instrument Serif font packages. Recharts and the extra fonts are full-dashboard dependencies; do not assume they are all required by the sidebar alone.

2. Verify the generated files
With your components.json aliases, the expected Medesk folder is:

text


src/components/watermelon/medesk-dashboard/
├── components/medesk/
│   ├── sidebar.tsx
│   ├── icons.tsx
│   ├── logo.tsx
│   ├── navigation.tsx
│   └── theme-provider.tsx
├── dashboard.css
└── data.tsx
Keep these files together initially. The sidebar imports its navigation groups and user from ../../data, plus local logo, icons, navigation, and theme hooks.

Also inspect generated src/components/ui/sidebar.tsx and its imported hooks/primitives. Use the generated Sidebar implementation, not the old fixed-position AppSidebar markup.

3. Resolve your existing primitive incompatibilities
Your repository already has some UI primitives, but matching filenames do not mean matching APIs.




Existing component	Medesk requirement	Action
avatar.tsx	<Avatar size="sm">	Use the generated compatible Avatar, or explicitly adapt its sizing
button.tsx	APIs used by the generated Sidebar and related primitives	Review/merge the generated Button API rather than keeping the limited current implementation
utils.ts	cn()	Preserve the existing implementation if compatible
Sidebar, Collapsible, DropdownMenu, Sheet	Shared interactive primitives	Keep their dependencies and provider behavior intact
For an exact initial replica, use the registry-compatible primitives. Review their other consumers before replacing shared files.

4. Verify Tailwind semantic tokens
Copying dashboard.css alone is not sufficient in your app: your current Tailwind stylesheet lacks several semantic mappings used by Medesk.

Ensure your global Tailwind stylesheet contains compatible mappings such as:

css


@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}
Merge, don’t blindly append: your current primary and accent mappings already serve existing screens. Replacing them requires checking login and other page styling, plus providing fallback tokens outside the dashboard.

5. Mount an unchanged sidebar preview
Create an isolated preview component:

tsx


import type { CSSProperties } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from
  "@/components/watermelon/medesk-dashboard/components/medesk/sidebar";
import { DashboardNavigationProvider } from
  "@/components/watermelon/medesk-dashboard/components/medesk/navigation";
import { ThemeProvider } from
  "@/components/watermelon/medesk-dashboard/components/medesk/theme-provider";
import "@/components/watermelon/medesk-dashboard/dashboard.css";

export function MedeskSidebarPreview() {
  return (
    <ThemeProvider
      defaultTheme="system"
      storageKey="medesk-sidebar-preview-theme"
    >
      <DashboardNavigationProvider>
        <SidebarProvider
          defaultOpen
          className="medesk-dashboard h-svh overflow-hidden no-scrollbar"
          style={{
            "--sidebar-width": "17.25rem",
            "--sidebar-width-icon": "5.125rem",
          } as CSSProperties}
        >
          <DashboardSidebar />

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-sidebar p-0 md:p-2 md:pl-0">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-xl">
              <header className="flex h-18 shrink-0 items-center px-5">
                <SidebarTrigger
                  className="md:hidden"
                  aria-label="Open navigation"
                />
                <span className="ml-2">Sidebar preview</span>
              </header>

              <div className="flex-1 overflow-y-auto p-6">
                Test expanded, collapsed, mobile, and theme states.
              </div>
            </div>
          </main>
        </SidebarProvider>
      </DashboardNavigationProvider>
    </ThemeProvider>
  );
}
This reproduces the Medesk sidebar and surrounding layout geometry, not the entire dashboard. Its navigation is still demo-local, and its logout item is not connected to your authentication.

6. Preserve the exact sidebar styling
Keep these source details unchanged during the replication pass:




Element	Medesk styling
Sidebar	collapsible="icon" and border-r-0!
Header	h-20, expanded logo/title, centered collapse control in icon mode
Menu rows	h-12.5, text-base, 20px icons
Active destination	Stronger text/font weight, transparent background
Group headings	text-[1.0625rem], regular weight
Content	gap-3 px-4 py-3
Footer	Account group, avatar dropdown, px-4 py-2
Rail	<SidebarRail />
Do not retain SOC 5’s lime active backgrounds, narrow widths, or old menu-row sizing if the goal is a faithful Medesk replica.

7. Integrate with Tallie and your real application
Once the unchanged preview is correct:

Keep one SidebarProvider around the Medesk sidebar and Tallie header/content.
Use Medesk’s width variables instead of Tallie’s sidebar widths.
Replace demo navigation with React Router’s location/navigation—or Link—while retaining active-state detection and mobile-close behavior.
Replace currentUser and navigationGroups with real user data and role-filtered SOC 5 routes.
Connect the logout dropdown item to your existing sign-out function.
Retain pending-count badges and route permission checks.
Remove the old sidebar, scrim, floating opener, and fixed 9.5rem/9rem content offsets.
Make the Tallie header’s mobile trigger use that same Sidebar provider.
Avoid placing both medesk-dashboard and tallie-dashboard classes on the same wrapper. Both define overlapping theme variables. Scope Medesk tokens to the sidebar and Tallie tokens to the content, and explicitly theme portaled mobile sheets, dropdowns, and tooltips.

Also review Medesk’s CSS: its dropdown-item padding selectors are global. Scope those selectors if Tallie’s menus should remain unchanged.

8. Verify before switching the production shell
bash


npm run build
npm run test
npm run lint:a11y
npm run test:e2e
Check:

Expanded/collapsed widths, labels, tooltips, and collapse button.
Collapsible groups and active-route styling.
Mobile drawer dismissal, keyboard focus, and close-on-navigation.
Avatar fallback, account dropdown, and light/dark appearance.
All four SOC 5 roles, pending badges, direct URLs, and sign-out.
Header/content alignment with no double sidebar spacing.
Your existing responsive test asserts an old sidebar CSS class, so update that implementation-specific assertion while retaining its overflow, alignment, and focus checks.

Reference: Watermelon Medesk Dashboard. No installation or source changes were performed.

Copy
Thumbs up
Thumbs down
Share snapshot
Oct 6, 2026, 1:28 PM
to setup provide complete guide including the file path what line to change or add

Copy
Oct 6, 2026, 2:10 PM

Thought process
Below is a file-by-file setup guide based on your current repository, with original line numbers and exact code anchors.

What I found: the Medesk template files now exist, but installation is incomplete: src/components/ui/sidebar.tsx, collapsible.tsx, and dropdown-menu.tsx are missing. Your existing Button and Avatar also still use their older APIs.

This guide preserves Medesk’s sidebar layout and styling, while connecting it to SOC 5 routes, roles, pending badges, and sign-out. Dashboard content and existing header functionality remain intact.

Line numbers refer to the files I just inspected. Apply changes using the quoted code anchors because line numbers shift after edits.

1. Complete the dependency installation
From your repository root:

bash


cd frontend

npx shadcn@latest add https://registry.watermelon.sh/r/medesk-dashboard.json
If the template files are present but its shared primitives are still missing, run:

bash


npx shadcn@latest add sidebar collapsible dropdown-menu avatar button input-group sheet
For button.tsx and avatar.tsx, review and accept the compatible generated versions after making a Git checkpoint. The current versions are insufficient for the generated dashboard files.

Verify these files exist:

text


frontend/src/components/ui/sidebar.tsx
frontend/src/components/ui/collapsible.tsx
frontend/src/components/ui/dropdown-menu.tsx
frontend/src/components/ui/avatar.tsx
frontend/src/components/ui/button.tsx
frontend/src/components/ui/input-group.tsx
frontend/src/components/ui/sheet.tsx
Keep any additional hooks and primitives imported by those generated files.

No alias edits are needed: your Vite and TypeScript configurations already map @/ to src/.

2. Connect Medesk navigation to React Router
File:

text


frontend/src/components/watermelon/medesk-dashboard/components/medesk/navigation.tsx
Change: replace the entire file, starting at line 1, with:

tsx


import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// Retains the template API without installing a second router.
export function DashboardNavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

export function useDashboardNavigation() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return {
    pathname,
    navigate: (path: string) => navigate(path),
  };
}

export function DashboardLink({
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link to={href} {...props} />;
}
This removes Medesk’s local demo route state. Active links now follow the actual browser URL, including back/forward navigation.

3. Make the Medesk sidebar accept application data
File:

text


frontend/src/components/watermelon/medesk-dashboard/components/medesk/sidebar.tsx
A. Replace the import at original line 44
Find:

tsx


import { currentUser, navigationGroups, type NavigationItem } from "../../data";
Replace with:

tsx


import {
  currentUser as demoUser,
  navigationGroups as demoGroups,
  type NavigationGroup,
  type NavigationItem,
} from "../../data";
B. Replace the function declaration at original line 91
Find:

tsx


export function DashboardSidebar() {
Replace with:

tsx


type DashboardSidebarProps = {
  currentUser?: {
    name: string;
    email?: string;
    avatar?: string;
  };
  navigationGroups?: NavigationGroup[];
  onSignOut?: () => void;
};

export function DashboardSidebar({
  currentUser = demoUser,
  navigationGroups = demoGroups,
  onSignOut,
}: DashboardSidebarProps) {
Leave the rest of the sidebar’s layout classes unchanged. These are what replicate Medesk’s spacing, collapsed rail, typography, and active states.

C. Theme the portaled account dropdown at original line 210
Find:

tsx


<DropdownMenuContent side="top" align="start" className="w-56">
Replace with:

tsx


<DropdownMenuContent
  side="top"
  align="start"
  className="medesk-dashboard w-56"
>
The dropdown renders outside the sidebar DOM. Giving it the Medesk class ensures it receives Medesk’s theme variables.

D. Connect logout at original line 249
Find:

tsx


<DropdownMenuItem variant="destructive">
Replace with:

tsx


<DropdownMenuItem
  variant="destructive"
  onSelect={() => onSignOut?.()}
>
E. Remove unrelated demo support links
At original lines 227–246, remove the two DropdownMenuItem asChild blocks linking to:

text


https://docs.medesk.com
https://medesk.com/support
Also remove these unused imports near the top:

tsx


BookOpenIcon,
MessageCircleIcon,
Keep the theme-switch item and logout item.

Branding: leave the MedeskLogo and Medesk text at original lines 100–103 for a literal replica. Changing these later to SOC 5 is a branding adaptation, not an exact copy.

4. Replace the old AppSidebar with a Medesk adapter
File:

text


frontend/src/components/AppSidebar.tsx
Change: replace the entire file with:

tsx


import {
  BarChart3,
  LayoutDashboard,
  Route,
  ShipWheel,
  Truck,
  Users,
} from "lucide-react";
import type { User } from "../types";
import type { NavigationGroup } from
  "./watermelon/medesk-dashboard/data";
import { DashboardSidebar } from
  "./watermelon/medesk-dashboard/components/medesk/sidebar";

type Props = {
  user: User;
  pendingCount: number;
  onSignOut: () => void;
};

export function AppSidebar({
  user,
  pendingCount,
  onSignOut,
}: Props) {
  const groups: NavigationGroup[] = [
    {
      label: "Workspace",
      collapsible: false,
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
  ];

  const badge =
    pendingCount > 0
      ? pendingCount > 99
        ? "99+"
        : String(pendingCount)
      : undefined;

  if (
    user.role === "ops_pic" ||
    user.role === "fte_ops" ||
    user.role === "doc_officer"
  ) {
    groups.push({
      label: "Outbound",
      collapsible: true,
      items: [
        {
          name: "LH Request",
          href: "/outbound/lh-request",
          icon: Route,
          badge: user.role === "fte_ops" ? badge : undefined,
        },
      ],
    });
  }

  if (user.role === "fte_mm") {
    groups.push({
      label: "Midmile",
      collapsible: true,
      items: [
        {
          name: "Truck Request",
          href: "/midmile/truck-request",
          icon: Truck,
          badge,
        },
      ],
    });
  }

  if (user.role === "doc_officer") {
    groups.push({
      label: "Docking",
      collapsible: true,
      items: [
        {
          name: "Docking Confirmation",
          href: "/docking",
          icon: ShipWheel,
          badge,
        },
      ],
    });
  }

  groups.push({
    label: "Performance",
    collapsible: true,
    items: [
      {
        name: "KPI",
        href: "/kpi",
        icon: BarChart3,
      },
    ],
  });

  if (user.role === "fte_ops" || user.role === "fte_mm") {
    groups.push({
      label: "Administration",
      collapsible: true,
      items: [
        {
          name: "User Management",
          href: "/users",
          icon: Users,
        },
      ],
    });
  }

  return (
    <DashboardSidebar
      currentUser={{
        name: user.name,
        email: user.email,
      }}
      navigationGroups={groups}
      onSignOut={onSignOut}
    />
  );
}
This preserves your role visibility rules. Without a real avatar URL, Medesk’s Avatar fallback displays the user’s initial.

5. Replace Dashboard’s fixed-position shell
File:

text


frontend/src/pages/Dashboard.tsx
A. Update the React import at original line 3
Replace:

tsx


import { lazy, Suspense, useEffect, useState } from "react";
With:

tsx


import { lazy, Suspense, useEffect, type CSSProperties } from "react";
B. Add these imports after the existing imports
tsx


import { SidebarProvider } from "../components/ui/sidebar";
import { ThemeProvider } from
  "../components/watermelon/medesk-dashboard/components/medesk/theme-provider";
import "../components/watermelon/medesk-dashboard/dashboard.css";
C. Delete original line 95
tsx


const [menuOpen, setMenuOpen] = useState(false);
The generated Sidebar provider now owns drawer/collapse state.

D. Replace the shell beginning at original line 125
Find the outer opening element:

tsx


<div className={`${preview && !builderPreview ? "dashboard-preview" : ""} app-shell min-h-[100dvh]`}>
Replace the opening shell through the opening inner <div> immediately before <AppHeader> with:

tsx


<ThemeProvider
  defaultTheme="light"
  storageKey="soc5-dashboard-theme"
>
  <SidebarProvider
    defaultOpen
    className="medesk-dashboard h-dvh min-h-0 overflow-hidden"
    style={{
      "--sidebar-width": "17.25rem",
      "--sidebar-width-icon": "5.125rem",
    } as CSSProperties}
  >
    {(!preview || builderPreview) && (
      <AppSidebar
        user={activeUser}
        onSignOut={() => void signOut()}
        pendingCount={queue.count}
      />
    )}

    <main
      className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sidebar p-0 md:p-2 md:pl-0"
      aria-label="Primary content"
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background md:rounded-xl">
Keep your existing <AppHeader>, <section>, <Suspense>, and all page branches below that point.

E. Replace the closing outer shell at original lines 167–170
After </section>, the ending should be:

tsx


      </div>
    </main>
  </SidebarProvider>
</ThemeProvider>
Do not leave the old outer </div>.

Important: this removes all old ml-[9.5rem], left-38, calculated widths, and header top padding from the content shell. The Sidebar primitive handles expanded/collapsed spacing.

6. Make the existing header work with the new shell
Your installed repository still uses the existing AppHeader. These edits retain its search, notification, date-filter, and role-preview behavior. They do not yet replace its appearance with Tallie.

File:

text


frontend/src/components/AppHeader.tsx
A. Add this import near the other component imports
tsx


import { SidebarTrigger } from "./ui/sidebar";
B. Replace the opening <header> at original line 297
Replace the entire opening tag containing:

text


fixed top-0 right-0 left-38 z-99999
With:

tsx


<header
  className={
    preview && !builderPreview
      ? "hidden"
      : "relative z-30 flex min-h-[3.8rem] shrink-0 items-center justify-between gap-3 border-b border-soc5-line bg-white px-4 max-[600px]:min-h-[3.1rem] max-[600px]:px-2"
  }
>
C. Add the mobile trigger before original line 307
Immediately before:

tsx


<div className="min-w-0 flex-1 overflow-hidden">
Insert:

tsx


<SidebarTrigger
  className="shrink-0 md:hidden"
  aria-label="Open navigation"
/>
Leave notification queries, mutations, realtime subscriptions, and role-switch callbacks unchanged.

When you later adopt Tallie’s topbar, its trigger must use this same SidebarProvider—not a second provider.

7. Correct Tailwind token placement
File:

text


frontend/src/styles/tailwind.css
Your stylesheet already contains semantic mappings, but many are inside ordinary @theme. Use @theme inline so utilities resolve variables on the Medesk element rather than relying on root-level values.

A. Remove original lines 145–171
Remove the block beginning:

css


--color-background: var(--background);
And ending:

css


--color-sidebar-ring: var(--sidebar-ring);
Leave the closing brace of the original @theme block intact.

B. Replace the final @theme inline block at original lines 378–387
Use:

css


@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}
C. Add fallback variables inside :root at original line 16
These preserve the existing authentication-related color defaults outside Medesk:

css


--background: var(--color-soc5-page);
--foreground: var(--color-soc5-ink);
--card: #ffffff;
--card-foreground: var(--color-soc5-ink);
--popover: #ffffff;
--popover-foreground: var(--color-soc5-ink);
--primary: var(--color-soc5-lime-deep);
--primary-foreground: #ffffff;
--secondary: #f1f2f2;
--secondary-foreground: var(--color-soc5-ink);
--muted: var(--color-auth-muted);
--muted-foreground: var(--color-soc5-muted);
--accent: var(--color-auth-accent);
--accent-foreground: #ffffff;
--destructive: var(--color-auth-danger);
--border: var(--color-soc5-line);
--input: var(--color-soc5-line);
--ring: var(--color-soc5-lime-deep);
--radius: 0.625rem;
Medesk’s scoped CSS overrides these values inside its sidebar/shell.

D. Remove duplicate mappings from ordinary @theme
Remove the original declarations at:

text


Line 132: --color-accent: var(--color-auth-accent);
Line 139: --color-muted: var(--color-auth-muted);
Line 143: --color-primary: var(--color-soc5-lime-deep);
Do not remove --color-accent-2 or the explicit --color-auth-* tokens.

E. Avoid the existing shell zoom
Original lines 360–365 apply zoom: 0.88 to .app-shell.

The replacement shell above intentionally does not use app-shell, so this rule will no longer shrink the sidebar. Do not add that class back if you want Medesk’s actual dimensions.

No edit to main.tsx is required: line 9 already imports ./styles/tailwind.css.

8. Scope Medesk dropdown styling
File:

text


frontend/src/components/watermelon/medesk-dashboard/dashboard.css
At the end of the file, find the global dropdown selectors beginning:

css


[data-slot="dropdown-menu-content"] [data-slot="dropdown-menu-item"],
Replace both dropdown rule blocks with:

css


.medesk-dashboard[data-slot="dropdown-menu-content"]
  [data-slot="dropdown-menu-item"],
.medesk-dashboard[data-slot="dropdown-menu-content"]
  [data-slot="dropdown-menu-sub-trigger"] {
  padding-inline: 0.625rem;
  padding-block: 0.625rem;
}

.medesk-dashboard[data-slot="dropdown-menu-content"]
  [data-slot="dropdown-menu-checkbox-item"],
.medesk-dashboard[data-slot="dropdown-menu-content"]
  [data-slot="dropdown-menu-radio-item"] {
  padding-block: 0.625rem;
  padding-left: 0.625rem;
  padding-right: 2rem;
}
Keep the existing light/dark variable blocks unchanged.

This prevents Medesk’s dropdown padding from changing future Tallie menus.

Medesk’s theme provider changes the document’s .dark class. Its theme toggle is therefore app-wide, not sidebar-only. Test other screens in dark mode before making that toggle available in production.

9. Verify the migration
Run from frontend:

bash


npm run build
npm run test
npm run lint:a11y
npm run test:e2e
Expected behavior:




Check	Expected result
Desktop expanded sidebar	276px wide
Desktop collapsed sidebar	82px wide
Collapse control	Toggles icon-only navigation
Mobile trigger	Opens the Sidebar primitive’s drawer
Navigation selection	Changes browser URL and closes mobile drawer
Active destination	Medesk text emphasis, not SOC 5 lime background
Account footer	Real user name and initial
Logout	Existing application sign-out flow
Role visibility	Same SOC 5 rules as before
Main/header positioning	No old fixed sidebar offsets
Test update required: frontend/e2e/responsive-shell.spec.ts currently asserts the old max-[960px]:translate-x-0! class and old scrim structure. Update that test to check the generated drawer’s visible state, close behavior, focus restoration, and absence of horizontal overflow instead.

The final structure should be:

text


Existing BrowserRouter + QueryClientProvider
└── Dashboard
    └── Medesk ThemeProvider
        └── One SidebarProvider
            ├── AppSidebar → Medesk DashboardSidebar
            └── Main content
                ├── AppHeader → shared SidebarTrigger
                └── Existing routed page content
These are source-grounded setup instructions, not applied changes. I have not modified files or verified the resulting build.

Copy
Thumbs up
Thumbs down
Share snapshot
Oct 6, 2026, 2:10 PM
generate a Full and Complete Setup guide for this.

Copy
Oct 6, 2026, 8:02 PM

Thought process
I’ll put together a complete guide with file paths, exact replacement blocks, integration code, and validation steps. I’ll also distinguish faithful Medesk replication from the changes needed to preserve SOC 5 behavior.

Copy
Thumbs up
Thumbs down
Share snapshot
Oct 6, 2026, 8:02 PM
Complete Setup Guide: Medesk Sidebar in SOC 5
This guide integrates Medesk’s sidebar into your existing application while preserving:

SOC 5 route permissions and role-specific navigation
Pending-count badges
Real user information and sign-out
Existing dashboard data, API calls, and realtime subscriptions
Existing header search, filters, notifications, and admin role preview
Tallie remains the intended dashboard/header reference. This guide completes the Medesk sidebar migration first; it does not replace your existing header with Tallie’s demo header.

Current repository status
I verified the following:




Item	Current state
Medesk template source	Present
Medesk sidebar and icons	Present, readable
Shared ui/sidebar.tsx	Missing
Shared Collapsible and DropdownMenu	Missing
Existing Button and Avatar	Older, incompatible APIs
React Router	Already configured
@/ aliases	Already configured in Vite and TypeScript
Tailwind	Version 4
Semantic theme mappings	Present, but duplicated and partly in the wrong block
Existing shell	Fixed sidebar/header positioning
Line numbers below refer to the inspected source before changes. Installation and edits can shift them; use the quoted code anchors as the authoritative replacement targets.

1. Create a checkpoint
Run these commands from the repository root:

bash


git status --short
git switch -c ui/medesk-sidebar-migration
Commit or otherwise preserve your current changes before installing registry components. Do not discard unrelated work.

This migration changes shared UI primitives, so review the resulting diff carefully.

2. Complete the Medesk installation
Run from frontend:

bash


cd frontend

npx shadcn@latest add https://registry.watermelon.sh/r/medesk-dashboard.json
The registry installs a complete dashboard, not just its sidebar.

If the template files already exist but shared components remain missing, install the dependencies explicitly:

bash


npx shadcn@latest add sidebar collapsible dropdown-menu avatar button input-group sheet
Overwrite handling
For existing files:

Review and accept compatible generated button.tsx and avatar.tsx.
Preserve your existing utils.ts if it already exports a compatible cn().
Do not use an overwrite-all flag without reviewing affected consumers.
Keep any additional hooks and primitives generated as dependencies.
Required files
Verify this structure:

text


frontend/
├── components.json
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── avatar.tsx
│   │   │   ├── button.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input-group.tsx
│   │   │   ├── sheet.tsx
│   │   │   └── sidebar.tsx
│   │   └── watermelon/
│   │       └── medesk-dashboard/
│   │           ├── components/medesk/
│   │           │   ├── icons.tsx
│   │           │   ├── logo.tsx
│   │           │   ├── navigation.tsx
│   │           │   ├── sidebar.tsx
│   │           │   └── theme-provider.tsx
│   │           ├── dashboard.css
│   │           └── data.tsx
│   └── hooks/
│       └── [hooks imported by generated sidebar.tsx]
Your current configuration already supports the registry paths:

text


frontend/components.json
frontend/vite.config.ts
frontend/tsconfig.app.json
Do not add a second router or rerun project initialization.

3. Connect Medesk navigation to React Router
File
text


frontend/src/components/watermelon/medesk-dashboard/components/medesk/navigation.tsx
Change
Replace the entire file, starting at line 1:

tsx


import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

/**
 * Retains the template's public API.
 * The application's existing BrowserRouter owns navigation.
 */
export function DashboardNavigationProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

export function useDashboardNavigation() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return {
    pathname,
    navigate: (path: string) => navigate(path),
  };
}

export function DashboardLink({
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link to={href} {...props} />;
}
Why
The original Medesk provider stores its pathname in local React state. It does not provide production browser routing.

This replacement enables:

Real URLs
Direct-link navigation
Browser back and forward
Active-state synchronization
React Router’s normal link behavior
Your existing BrowserRouter in frontend/src/main.tsx remains unchanged.

4. Make the Medesk sidebar reusable
File
text


frontend/src/components/watermelon/medesk-dashboard/components/medesk/sidebar.tsx
Keep the Medesk markup and class names unless a change is explicitly listed below.

4.1 Replace the data import
Original line 44:

tsx


import { currentUser, navigationGroups, type NavigationItem } from "../../data";
Replace with:

tsx


import {
  currentUser as demoUser,
  navigationGroups as demoGroups,
  type NavigationGroup,
  type NavigationItem,
} from "../../data";
4.2 Add props to DashboardSidebar
Original line 91:

tsx


export function DashboardSidebar() {
Replace with:

tsx


type DashboardSidebarProps = {
  currentUser?: {
    name: string;
    email?: string;
    avatar?: string;
  };
  navigationGroups?: NavigationGroup[];
  onSignOut?: () => void;
};

export function DashboardSidebar({
  currentUser = demoUser,
  navigationGroups = demoGroups,
  onSignOut,
}: DashboardSidebarProps) {
Keep the existing function body after this declaration.

Defaults preserve the ability to render an unchanged Medesk demo. Your application adapter will supply real values.

4.3 Theme the account dropdown
Original line 210:

tsx


<DropdownMenuContent side="top" align="start" className="w-56">
Replace with:

tsx


<DropdownMenuContent
  side="top"
  align="start"
  className="medesk-dashboard w-56"
>
The dropdown is portaled outside the sidebar. It needs its own Medesk theme scope.

4.4 Connect logout
Original line 249:

tsx


<DropdownMenuItem variant="destructive">
Replace with:

tsx


<DropdownMenuItem
  variant="destructive"
  onSelect={() => onSignOut?.()}
>
Keep its existing icon and Log out label.

4.5 Remove unrelated Medesk support links
Remove the two account-menu blocks linking to:

text


https://docs.medesk.com
https://medesk.com/support
These are around original lines 227–246.

Also remove these now-unused imports:

tsx


BookOpenIcon,
MessageCircleIcon,
Do not replace the links with guessed SOC 5 support URLs.

4.6 Preserve Medesk’s visual settings
Leave these source settings unchanged:

tsx


<Sidebar collapsible="icon" className="border-r-0!">
tsx


<SidebarRail />
And retain the existing:

h-20 sidebar header
h-12.5 menu-row height
size-5 navigation icons
Transparent active-item backgrounds
Collapsible group structure
px-4 content/footer padding
Icon-mode classes and tooltips
Branding boundary
For a literal visual replica, keep:

tsx


<MedeskLogo className="size-7 shrink-0" />
and:

tsx


Medesk
Changing these to SOC 5 is a deliberate branding adaptation. It does not require changing navigation layout or behavior.

5. Replace the old AppSidebar with an adapter
File
text


frontend/src/components/AppSidebar.tsx
Change
Replace the entire file with:

tsx


import {
  BarChart3,
  LayoutDashboard,
  Route,
  ShipWheel,
  Truck,
  Users,
} from "lucide-react";
import type { User } from "../types";
import type { NavigationGroup } from
  "./watermelon/medesk-dashboard/data";
import { DashboardSidebar } from
  "./watermelon/medesk-dashboard/components/medesk/sidebar";

type Props = {
  user: User;
  pendingCount: number;
  onSignOut: () => void;
};

export function AppSidebar({
  user,
  pendingCount,
  onSignOut,
}: Props) {
  const groups: NavigationGroup[] = [
    {
      label: "Workspace",
      collapsible: false,
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
  ];

  const badge =
    pendingCount > 0
      ? pendingCount > 99
        ? "99+"
        : String(pendingCount)
      : undefined;

  if (
    user.role === "ops_pic" ||
    user.role === "fte_ops" ||
    user.role === "doc_officer"
  ) {
    groups.push({
      label: "Outbound",
      collapsible: true,
      items: [
        {
          name: "LH Request",
          href: "/outbound/lh-request",
          icon: Route,
          badge: user.role === "fte_ops" ? badge : undefined,
        },
      ],
    });
  }

  if (user.role === "fte_mm") {
    groups.push({
      label: "Midmile",
      collapsible: true,
      items: [
        {
          name: "Truck Request",
          href: "/midmile/truck-request",
          icon: Truck,
          badge,
        },
      ],
    });
  }

  if (user.role === "doc_officer") {
    groups.push({
      label: "Docking",
      collapsible: true,
      items: [
        {
          name: "Docking Confirmation",
          href: "/docking",
          icon: ShipWheel,
          badge,
        },
      ],
    });
  }

  groups.push({
    label: "Performance",
    collapsible: true,
    items: [
      {
        name: "KPI",
        href: "/kpi",
        icon: BarChart3,
      },
    ],
  });

  if (user.role === "fte_ops" || user.role === "fte_mm") {
    groups.push({
      label: "Administration",
      collapsible: true,
      items: [
        {
          name: "User Management",
          href: "/users",
          icon: Users,
        },
      ],
    });
  }

  return (
    <DashboardSidebar
      currentUser={{
        name: user.name,
        email: user.email,
      }}
      navigationGroups={groups}
      onSignOut={onSignOut}
    />
  );
}
Behavior preserved



Role	Navigation
Ops PIC	Dashboard, LH Request, KPI
FTE Ops	Dashboard, LH Request, KPI, User Management
FTE Midmile	Dashboard, Truck Request, KPI, User Management
Document Officer	Dashboard, LH Request, Docking Confirmation, KPI
The application’s existing route checks remain responsible for accessible page selection. Sidebar visibility is not a replacement for authorization.

Without a real avatar URL, the Avatar fallback displays the user’s initial.

Difference from the old sidebar
Medesk allows multiple collapsible groups to remain open and initializes them with defaultOpen. Your old sidebar managed one expanded group.

The guide deliberately retains Medesk’s group behavior.

6. Integrate the Sidebar provider into Dashboard
File
text


frontend/src/pages/Dashboard.tsx
6.1 Update the React import
Original line 3:

tsx


import { lazy, Suspense, useEffect, useState } from "react";
Replace with:

tsx


import {
  lazy,
  Suspense,
  useEffect,
  type CSSProperties,
} from "react";
6.2 Add imports
Add below the existing imports:

tsx


import { SidebarProvider } from "../components/ui/sidebar";
import { ThemeProvider } from
  "../components/watermelon/medesk-dashboard/components/medesk/theme-provider";
import "../components/watermelon/medesk-dashboard/dashboard.css";
6.3 Remove old drawer state
Delete the original line around 95:

tsx


const [menuOpen, setMenuOpen] = useState(false);
The generated Sidebar provider now owns collapse and mobile-drawer state.

6.4 Replace Dashboard’s return block
Replace the return block beginning around original line 124, ending immediately before the closing brace of Dashboard.

Do not replace ViewLoading below the Dashboard function.

Use:

tsx


return (
  <ThemeProvider
    defaultTheme="light"
    storageKey="soc5-dashboard-theme"
  >
    <SidebarProvider
      defaultOpen
      className="medesk-dashboard h-dvh min-h-0 overflow-hidden"
      style={{
        "--sidebar-width": "17.25rem",
        "--sidebar-width-icon": "5.125rem",
      } as CSSProperties}
    >
      {(!preview || builderPreview) && (
        <AppSidebar
          user={activeUser}
          onSignOut={() => void signOut()}
          pendingCount={queue.count}
        />
      )}

      <main
        className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sidebar p-0 md:p-2 md:pl-0"
        aria-label="Primary content"
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background md:rounded-xl">
          <AppHeader
            user={activeUser}
            preview={preview}
            builderPreview={builderPreview}
            view={view}
            onRoleChange={switchRole}
            onSearch={() =>
              navigate(
                activeUser.role === "fte_mm"
                  ? "truck-request"
                  : "lh-request",
              )
            }
          />

          <section
            className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-y-contain"
            aria-live="polite"
          >
            <Suspense fallback={<ViewLoading view={view} />}>
              {view === "overview" && (
                <Overview
                  user={activeUser}
                  onNavigate={navigate}
                  preview={preview}
                />
              )}

              {view === "lh-request" && (
                <OutboundRequests
                  user={activeUser}
                  queue={queue}
                />
              )}

              {view === "truck-request" && (
                <MidmileRequests user={activeUser} />
              )}

              {view === "docking" && (
                <DockingConfirmation user={activeUser} />
              )}

              {view === "kpi" && <Kpi />}
              {view === "users" && <UserManagement />}
            </Suspense>
          </section>
        </div>
      </main>
    </SidebarProvider>
  </ThemeProvider>
);
Keep unchanged
Retain all logic above the return block:

useRequestRealtime()
Role preview and allowed()
getAppView() and route correction
Queue notifications
switchRole()
navigate()
signOut()
Geometry
The new Sidebar primitive manages the occupied desktop width.

Do not retain any old shell classes containing:

text


ml-[9.5rem]
ml-[9rem]
w-[calc(100%_-_9.5rem)]
w-[calc(100%_-_9rem)]
pt-[3.8rem]
Do not add the old app-shell class. Your stylesheet applies zoom: 0.88 to that class on desktop, which would shrink Medesk’s dimensions.

Preview behavior
The non-builder preview hides both sidebar and header. Builder preview continues to show the application shell.

The previous outer dashboard-preview class is not included. Verify any preview-specific visual treatment before release if you depend on that class elsewhere.

7. Adapt AppHeader to the new layout
File
text


frontend/src/components/AppHeader.tsx
These edits keep the current header’s functionality. They only change its placement and add the shared drawer opener.

7.1 Add import
Add near the other component imports:

tsx


import { SidebarTrigger } from "./ui/sidebar";
7.2 Replace the header opening tag
At original line 297, replace the opening tag containing:

text


fixed top-0 right-0 left-38 z-99999
with:

tsx


<header
  className={
    preview && !builderPreview
      ? "hidden"
      : "relative z-30 flex min-h-[3.8rem] shrink-0 items-center justify-between gap-3 border-b border-soc5-line bg-white px-4 max-[600px]:min-h-[3.1rem] max-[600px]:px-2"
  }
>
The header is now in normal layout flow. It no longer needs a fixed left offset.

7.3 Add mobile navigation opener
Immediately before the element originally at line 307:

tsx


<div className="min-w-0 flex-1 overflow-hidden">
insert:

tsx


<SidebarTrigger
  className="shrink-0 md:hidden"
  aria-label="Open navigation"
/>
7.4 Preserve header logic
Do not remove:

Request search state and submit handling
Date-range filters
Notification queries and mutations
Supabase notification subscription
Notification grouping and unread count
Admin-only role preview
Existing search keyboard shortcut
When replacing the header with Tallie later, connect these behaviors explicitly rather than importing Tallie’s sample notifications and user data.

8. Consolidate Tailwind theme mappings
File
text


frontend/src/styles/tailwind.css
8.1 Keep the existing imports
Keep:

css


@import "tailwindcss";

@custom-variant dark (&:is(.dark *));
Your main.tsx already imports this stylesheet. No additional import is needed there.

8.2 Remove semantic mappings from ordinary @theme
Inside the ordinary @theme block, remove the block originally at lines 145–171, starting with:

css


--color-background: var(--background);
and ending with:

css


--color-sidebar-ring: var(--sidebar-ring);
Keep the closing brace of @theme.

Also remove these duplicate declarations from that ordinary block:

css


--color-accent: var(--color-auth-accent);
--color-muted: var(--color-auth-muted);
--color-primary: var(--color-soc5-lime-deep);
Originally these are around lines 132, 139, and 143.

Keep the explicit authentication tokens:

text


--color-auth-accent
--color-auth-muted
--color-auth-danger
and other existing SOC 5 tokens.

8.3 Replace the final @theme inline block
The existing block starts around original line 378.

Replace it with:

css


@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);

  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);

  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);

  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}
This lets utilities resolve Medesk’s scoped variables on the elements where they are used.

8.4 Add root fallback values
Inside the first :root block, originally starting at line 16, add:

css


--background: var(--color-soc5-page);
--foreground: var(--color-soc5-ink);

--card: #ffffff;
--card-foreground: var(--color-soc5-ink);
--popover: #ffffff;
--popover-foreground: var(--color-soc5-ink);

--primary: var(--color-soc5-lime-deep);
--primary-foreground: #ffffff;

--secondary: #f1f2f2;
--secondary-foreground: var(--color-soc5-ink);

--muted: var(--color-auth-muted);
--muted-foreground: var(--color-soc5-muted);

--accent: var(--color-auth-accent);
--accent-foreground: #ffffff;

--destructive: var(--color-auth-danger);
--border: var(--color-soc5-line);
--input: var(--color-soc5-line);
--ring: var(--color-soc5-lime-deep);

--radius: 0.625rem;
Do not duplicate the existing --sidebar-* values already present in that block.

Why fallback values matter
Your login components use classes such as:

text


bg-accent
text-muted
focus:border-accent
Medesk also uses those semantic names.

The fallback values retain authentication colors outside the Medesk scope, while Medesk overrides the variables within its dashboard.

Regression-test login after this change.

9. Scope the Medesk dropdown CSS
File
text


frontend/src/components/watermelon/medesk-dashboard/dashboard.css
Keep the existing light/dark Medesk variable blocks.

At the bottom, replace the two global dropdown rules beginning with:

css


[data-slot="dropdown-menu-content"] [data-slot="dropdown-menu-item"],
with:

css


.medesk-dashboard[data-slot="dropdown-menu-content"]
  [data-slot="dropdown-menu-item"],
.medesk-dashboard[data-slot="dropdown-menu-content"]
  [data-slot="dropdown-menu-sub-trigger"] {
  padding-inline: 0.625rem;
  padding-block: 0.625rem;
}

.medesk-dashboard[data-slot="dropdown-menu-content"]
  [data-slot="dropdown-menu-checkbox-item"],
.medesk-dashboard[data-slot="dropdown-menu-content"]
  [data-slot="dropdown-menu-radio-item"] {
  padding-block: 0.625rem;
  padding-left: 0.625rem;
  padding-right: 2rem;
}
This works with the medesk-dashboard class added to the account dropdown in Step 4.

It also avoids changing Tallie’s future dropdown spacing.

10. Handle light and dark themes deliberately
File
text


frontend/src/components/watermelon/medesk-dashboard/components/medesk/theme-provider.tsx
The installed provider:

Stores the selected theme in local storage
Watches the system preference when using system
Changes the document’s light/dark class
No provider code change is required for the initial integration.

The shell uses:

tsx


defaultTheme="light"
storageKey="soc5-dashboard-theme"
Important limitation
The account theme toggle changes the whole document, not only the sidebar.

Your current AppHeader and other existing pages include hardcoded white backgrounds and fixed text colors. They are not fully migrated to a shared dark theme.

Before production rollout, either:

Complete dark-theme checks for all accessible pages; or
Temporarily remove the theme-switch menu item while retaining the provider with a light default.
A stored theme overrides the default. Changing defaultTheme alone does not reset a previous selection.

Exact-replica distinction
Keeping the theme switch matches Medesk’s interaction. Removing it is a temporary production-safety adaptation.

11. Verify appearance before branding changes
Use the installed Medesk source as the visual baseline.




Element	Source setting
Expanded width	17.25rem
Collapsed width	5.125rem
Header height	h-20
Menu-row height	h-12.5
Navigation icons	size-5
Group heading	text-[1.0625rem]
Active link	Text/font emphasis, transparent background
Sidebar border	border-r-0!
Collapse interaction	Button plus SidebarRail
Account menu	Avatar, theme switch, logout
At a normal 16px root size and 100% zoom, the expanded and collapsed widths correspond to approximately 276px and 82px.

Typography
The inspected Medesk sidebar CSS does not itself set a complete font family. Your application currently uses Manrope.

Do not assume installing Geist automatically changes the sidebar font. For pixel-level matching, compare the reference’s computed typography and explicitly scope the chosen font only after verification.

The layout/class settings above are verified from the installed source; exact screenshot equivalence has not been runtime-verified.

12. Integrate Tallie later without a second shell
Your final structure should remain:

text


BrowserRouter
└── QueryClientProvider
    └── Dashboard
        └── One ThemeProvider
            └── One SidebarProvider
                ├── Medesk AppSidebar
                └── Main content
                    ├── AppHeader / adapted Tallie topbar
                    └── Existing dashboard and routed pages
When adding Tallie:

Do not mount TallieDashboardDemo.
Do not add Tallie’s demo router.
Do not add a second Sidebar provider.
Do not add a competing theme provider.
Keep Medesk’s sidebar width variables.
Connect Tallie’s mobile trigger to the shared provider.
Preserve existing header data/actions.
Do not place both medesk-dashboard and tallie-dashboard classes on the same wrapper. They define overlapping variables.

If Tallie’s content styling is adopted later, scope it on the main-content subtree and verify portaled menus and sheets independently.

13. Update responsive tests
File
text


frontend/e2e/responsive-shell.spec.ts
The existing test checks the old custom sidebar implementation, including:

text


max-[960px]:translate-x-0!
#primary-navigation
Close navigation scrim
Those checks will become obsolete.

Replace implementation-specific checks with behavioral checks for:

Mobile opener visible
Drawer opens
Drawer closes through its accessible close control
Escape closes the drawer
Focus returns to the opener
Selecting Dashboard closes the drawer
No horizontal overflow
Main content remains visible at different viewport widths
Use accessible roles/names from the actually generated Sheet/Sidebar. Do not assume its close button is called Close navigation; inspect the rendered accessible name first.

Route correction in existing tests
Your app uses BrowserRouter.

For builder preview, use:

text


/dashboard?builderPreview=1
rather than:

text


/?builderPreview=1#/dashboard
The hash is not the application route.

Also inspect:

text


frontend/e2e/scorecards-layout.spec.ts
Changing the sidebar width changes available content width. Keep its scorecard composition assertions if they remain intentional; do not weaken them merely to make the migration pass.

14. Run verification
From frontend:

bash


npm run build
npm run test
npm run lint:a11y
npm run test:e2e
For a manual preview:

bash


npm run dev
Then open your configured development origin at:

text


/dashboard?builderPreview=1
Builder preview verifies presentation, not authenticated notification delivery or production authorization.

Manual acceptance checklist
Layout
Expanded and collapsed widths match Medesk.
Content does not retain old left margins.
Header aligns with content.
No double sidebar or duplicate mobile opener.
No horizontal page overflow.
Collapse/expand works at normal browser zoom.
Navigation
Dashboard, LH Request, Truck Request, Docking, KPI, and Users navigate correctly.
Active links follow browser back/forward.
Direct URLs load correctly.
Unauthorized views follow existing application rules.
Collapsible groups remain usable in icon mode.
Mobile
Drawer opens from the header.
Escape and close controls dismiss it.
Focus returns to the opener.
Selecting a navigation item closes it.
Background interaction follows the generated Sheet’s modal behavior.
Account
Real user name is displayed.
Avatar fallback is readable.
Sign-out invokes existing authentication cleanup.
No unrelated Medesk support links remain.
Existing application behavior
Pending badges retain role-specific behavior.
Request search still submits.
Date filters still update dashboard data.
Notifications still refresh through realtime.
Mark-one and mark-all-read still work.
Admin role preview still resets to Dashboard.
Login styling remains correct.
15. Troubleshooting



Symptom	Likely cause	Fix
Cannot resolve @/components/ui/sidebar	Shared primitives missing	Complete Step 2
Avatar size="sm" type error	Old Avatar API retained	Review generated Avatar replacement
Missing buttonVariants or variant type errors	Old Button retained	Use compatible generated Button
useTheme must be used within a ThemeProvider	Sidebar outside provider	Apply Step 6
Sidebar is too narrow	Old widths or shell zoom remain	Remove old offsets; omit app-shell
Content has a large empty left gap	Old fixed margins retained	Replace Dashboard shell
Header overlaps sidebar	Old fixed left-38 remains	Apply Step 7
Sidebar has wrong colors	Token mappings not inline/scoped	Apply Steps 8–9
Account dropdown has wrong colors	Portal lacks Medesk class	Apply Step 4.3
Clicking navigation only changes demo content	Original local navigation remains	Replace navigation.tsx
Mobile drawer never opens	Trigger uses a different provider	Keep one shared Sidebar provider
Login colors change	Semantic mappings lost root fallbacks	Apply Step 8.4 and test login
Dark sidebar but white existing pages	Partial dark-theme migration	Treat dark mode as incomplete
Old E2E navigation test fails	Test asserts removed markup/classes	Apply Step 13
16. Review and checkpoint the result
Inspect the diff before committing:

bash


git diff --stat
git diff -- frontend/src/components
git diff -- frontend/src/pages/Dashboard.tsx
git diff -- frontend/src/styles/tailwind.css
git diff -- frontend/package.json frontend/package-lock.json
Pay particular attention to:

Shared primitive replacements
Registry-generated CSS changes
Added dependencies
Removed fixed-position shell classes
Any changes unrelated to this migration
Keep the original checkpoint available for rollback. Restore only the migration’s files or revert its isolated commit; do not use a blanket reset that discards unrelated work.

Completion criteria
The setup is complete when:

All generated sidebar dependencies exist.
Medesk sidebar renders in expanded, collapsed, and mobile states.
Real routing, roles, badges, user data, and logout are connected.
The old fixed sidebar positioning is removed.
Theme variables and portaled menus are correct.
Build, tests, accessibility checks, and manual acceptance checks pass.
Status: this is the complete, source-grounded implementation guide. No application files were modified and no resulting build was executed by me.