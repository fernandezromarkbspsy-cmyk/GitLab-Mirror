import type { CSSProperties, ReactNode } from "react";
import { DashboardSidebar } from "./components/medesk/sidebar";
import { DashboardTopbar } from "./components/medesk/topbar";
import { SidebarProvider } from "@/components/ui/sidebar";
<<<<<<< HEAD
import { TooltipProvider } from "@/components/ui/tooltip";
import type { NavigationGroup } from "./data";
import type { Role } from "@/types";
import { ThemeProvider } from "./components/medesk/theme-provider";
=======
>>>>>>> c236f8f (medesk-nav)
import "./dashboard.css";

type DashboardLayoutProps = {
  children: ReactNode;
<<<<<<< HEAD
  navigationGroups?: NavigationGroup[];
  currentUser?: { name: string; email: string; avatar?: string; role?: Role; isAdmin?: boolean };
  onSignOut?: () => void;
  onRoleChange?: (role: Role) => void;
};

export default function DashboardLayout({ children, navigationGroups, currentUser, onSignOut, onRoleChange }: DashboardLayoutProps) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="soc5-medesk-theme">
      <TooltipProvider>
        <SidebarProvider
          defaultOpen
          className="app-shell medesk-dashboard h-svh overflow-hidden no-scrollbar"
          style={
            {
              "--sidebar-width": "17.25rem",
              "--sidebar-width-icon": "5.125rem",
            } as CSSProperties
          }
        >
          <DashboardSidebar navigationGroups={navigationGroups} currentUser={currentUser} onSignOut={onSignOut} onRoleChange={onRoleChange} />

          <main aria-label="Primary content" className="flex flex-1 flex-col overflow-hidden bg-sidebar p-0 md:p-2 md:pl-0">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-xl">
              <DashboardTopbar navigationGroups={navigationGroups} />
              <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
          </main>
        </SidebarProvider>
      </TooltipProvider>
    </ThemeProvider>
=======
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider
      defaultOpen
      className="medesk-dashboard h-svh overflow-hidden no-scrollbar"
      style={
        {
          "--sidebar-width": "17.25rem",
          "--sidebar-width-icon": "5.125rem",
        } as CSSProperties
      }
    >
      <DashboardSidebar />

      <main className="flex flex-1 flex-col overflow-hidden bg-sidebar p-0 md:p-2 md:pl-0">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-xl">
          <DashboardTopbar />
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </main>
    </SidebarProvider>
>>>>>>> c236f8f (medesk-nav)
  );
}
