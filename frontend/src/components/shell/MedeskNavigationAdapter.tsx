import { useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import type { User } from "../../types";
import {
  BarChart3,
  LayoutDashboard,
  Route,
  ShipWheel,
  Truck,
  Users,
} from "lucide-react";
import {
  DashboardNavigationProvider,
} from "../watermelon/medesk-dashboard/components/medesk/navigation";
import type { NavigationGroup } from "../watermelon/medesk-dashboard/data";

type NavigationOptions = Pick<User, "role"> & { pendingCount: number };

export function createAppNavigationGroups({ role, pendingCount }: NavigationOptions): NavigationGroup[] {
  const groups: NavigationGroup[] = [
    {
      label: "Workspace",
      items: [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
    },
  ];

  if (role === "ops_pic" || role === "fte_ops" || role === "doc_officer") {
    groups.push({
      label: "Outbound",
      collapsible: true,
      items: [{ name: "LH Request", href: "/outbound/lh-request", icon: Route, badge: pendingCount > 0 ? String(Math.min(pendingCount, 99)) : undefined }],
    });
  }

  if (role === "fte_mm") {
    groups.push({
      label: "Midmile",
      collapsible: true,
      items: [{ name: "Truck Request", href: "/midmile/truck-request", icon: Truck, badge: pendingCount > 0 ? String(Math.min(pendingCount, 99)) : undefined }],
    });
  }

  if (role === "doc_officer") {
    groups.push({
      label: "Operations",
      items: [{ name: "Docking", href: "/docking", icon: ShipWheel, badge: pendingCount > 0 ? String(Math.min(pendingCount, 99)) : undefined }],
    });
  }

  groups.push({
    label: "Performance",
    items: [{ name: "KPI", href: "/kpi", icon: BarChart3 }],
  });

  if (role === "fte_ops" || role === "fte_mm") {
    groups.push({
      label: "Administration",
      items: [{ name: "User Management", href: "/users", icon: Users }],
    });
  }

  return groups;
}

export function MedeskNavigationAdapter({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <DashboardNavigationProvider
      pathname={location.pathname}
      navigate={(pathname) => navigate(pathname)}
    >
      {children}
    </DashboardNavigationProvider>
  );
}
