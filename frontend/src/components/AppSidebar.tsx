import {
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  ShipWheel,
  Truck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { AppView, User } from "../types";

type Props = {
  user: User;
  activeView: AppView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: AppView) => void;
  onSignOut: () => void;
  pendingCount: number;
};

const roleNames = {
  ops_pic: "Ops PIC",
  fte_ops: "FTE Ops",
  fte_mm: "FTE Midmile",
  doc_officer: "Document Officer",
  dock_officer: "Dock Officer",
} as const;

type MenuGroup = "outbound" | "midmile";

function groupForView(view: AppView): MenuGroup | null {
  if (view === "lh-request") return "outbound";
  if (view === "truck-request") return "midmile";
  return null;
}

export function AppSidebar({
  user,
  activeView,
  open,
  onOpenChange,
  onNavigate,
  onSignOut,
  pendingCount,
}: Props) {
  const showOutbound = user.role === "ops_pic" || user.role === "fte_ops";
  const showMidmile = user.role === "fte_mm";
  const showDocking =
    user.role === "doc_officer" || user.role === "dock_officer";
  const showKpi = user.role === "fte_ops";
  const showUsers = user.role === "fte_ops" || user.role === "fte_mm";
  const [expanded, setExpanded] = useState<MenuGroup | null>(() =>
    groupForView(activeView),
  );
  const [hoveredGroup, setHoveredGroup] = useState<MenuGroup | null>(null);

  useEffect(() => {
    setExpanded(groupForView(activeView));
  }, [activeView]);

  const visibleGroup = hoveredGroup ?? expanded;

  function toggleGroup(group: MenuGroup) {
    setExpanded((value) => (value === group ? null : group));
    setHoveredGroup(null);
  }

  function navigate(view: AppView) {
    onNavigate(view);
    onOpenChange(false);
  }

  return (
    <>
      <button
        className="mobile-nav-toggle"
        type="button"
        title="Open navigation"
        aria-label="Open navigation"
        onClick={() => onOpenChange(true)}
      >
        <PanelLeftOpen size={18} />
        <span>Menu</span>
      </button>
      <div
        className={`sidebar-scrim${open ? " is-open" : ""}`}
        onClick={() => onOpenChange(false)}
      />
      <aside className={`app-sidebar${open ? " is-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">
            <img src="/dashboard-icon/icon_logo.png" alt="SOC 5" />
          </div>
          <div className="sidebar-brand-copy">
            <strong className="sidebar-brand-title">SOC 5</strong>
            <small className="sidebar-brand-subtitle">
              Outbound operations
            </small>
          </div>
          <button
            className="sidebar-close"
            type="button"
            title="Close navigation"
            aria-label="Close navigation"
            onClick={() => onOpenChange(false)}
          >
            <PanelLeftClose size={17} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Primary navigation" className="sidebar-nav">
          <div className="nav-section">
            <p>Workspace</p>
            <button
              className={`nav-link${activeView === "overview" ? " active" : ""}`}
              type="button"
              onClick={() => navigate("overview")}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
          </div>
          {showOutbound && (
            <div
              className="nav-section"
              onMouseEnter={() => setHoveredGroup("outbound")}
              onMouseLeave={() => setHoveredGroup(null)}
            >
              <p>Outbound</p>
              <button
                className={`nav-group-toggle${visibleGroup === "outbound" ? " is-open" : ""}`}
                type="button"
                aria-expanded={visibleGroup === "outbound"}
                aria-label="Toggle outbound requests"
                onClick={() => toggleGroup("outbound")}
              >
                <Route size={17} />
                <span>Requests</span>
                <ChevronRight size={15} className="nav-group-chevron" />
              </button>
              {visibleGroup === "outbound" && (
                <button
                  className={`nav-subitem${activeView === "lh-request" ? " active" : ""}`}
                  onClick={() => navigate("lh-request")}
                >
                  <Route size={17} />
                  <span>LH Request</span>
                  {user.role === "fte_ops" && pendingCount > 0 && (
                    <span className="nav-badge">
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
          {showMidmile && (
            <div
              className="nav-section"
              onMouseEnter={() => setHoveredGroup("midmile")}
              onMouseLeave={() => setHoveredGroup(null)}
            >
              <p>Midmile</p>
              <button
                className={`nav-group-toggle${visibleGroup === "midmile" ? " is-open" : ""}`}
                type="button"
                aria-expanded={visibleGroup === "midmile"}
                aria-label="Toggle midmile requests"
                onClick={() => toggleGroup("midmile")}
              >
                <Truck size={17} />
                <span>Requests</span>
                <ChevronRight size={15} className="nav-group-chevron" />
              </button>
              {visibleGroup === "midmile" && (
                <button
                  className={`nav-subitem${activeView === "truck-request" ? " active" : ""}`}
                  onClick={() => navigate("truck-request")}
                >
                  <Truck size={17} />
                  <span>Truck Request</span>
                  {pendingCount > 0 && (
                    <span className="nav-badge">
                      {pendingCount > 99 ? "99+" : pendingCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          )}
          {showDocking && (
            <div className="nav-section">
              <p>Docking</p>
              <button
                className={`nav-link${activeView === "docking" ? " active" : ""}`}
                onClick={() => navigate("docking")}
              >
                <ShipWheel size={18} />
                <span>Docking Confirmation</span>
                {pendingCount > 0 && (
                  <span className="nav-badge">{pendingCount}</span>
                )}
              </button>
            </div>
          )}
          {showKpi && (
            <div className="nav-section">
              <p>Performance</p>
              <button
                className={`nav-link${activeView === "kpi" ? " active" : ""}`}
                onClick={() => navigate("kpi")}
              >
                <BarChart3 size={18} />
                <span>KPI Analytics</span>
              </button>
            </div>
          )}
          {showUsers && (
            <div className="nav-section">
              <p>Administration</p>
              <button
                className={`nav-link${activeView === "users" ? " active" : ""}`}
                onClick={() => navigate("users")}
              >
                <Users size={18} />
                <span>User Management</span>
              </button>
            </div>
          )}
        </nav>

        <div className="sidebar-account">
          <div className="account-avatar" aria-hidden="true">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="sidebar-account-copy">
            <strong>{user.name}</strong>
            <small>{roleNames[user.role]}</small>
          </div>
          <button
            type="button"
            title="Sign out"
            aria-label="Sign out"
            onClick={onSignOut}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
