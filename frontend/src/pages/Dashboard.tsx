import { useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { AppSidebar } from "../components/AppSidebar";
import { SkeletonTable } from "../components/SkeletonTable";
import { useQueueNotifications } from "../hooks/useQueueNotifications";
import { getAppPath, getAppView } from "../lib/routes";
import { supabase } from "../lib/supabase";
import { useUiStore } from "../stores/ui";
import type { AppView, Role, User } from "../types";

const Overview = lazy(() =>
  import("./Overview").then((module) => ({ default: module.Overview })),
);
const OutboundRequests = lazy(() =>
  import("./OutboundRequests").then((module) => ({
    default: module.OutboundRequests,
  })),
);
const MidmileRequests = lazy(() =>
  import("./MidmileRequests").then((module) => ({
    default: module.MidmileRequests,
  })),
);
const DockingConfirmation = lazy(() =>
  import("./DockingConfirmation").then((module) => ({
    default: module.DockingConfirmation,
  })),
);
const Kpi = lazy(() =>
  import("./Kpi").then((module) => ({ default: module.Kpi })),
);
const UserManagement = lazy(() =>
  import("./UserManagement").then((module) => ({
    default: module.UserManagement,
  })),
);

export function Dashboard({
  user,
  preview = false,
}: {
  user: User;
  preview?: boolean;
}) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const routerNavigate = useNavigate();
  const viewRole = useUiStore((state) => state.viewRole);
  const setViewRole = useUiStore((state) => state.setViewRole);
  const activeUser = {
    ...user,
    role: user.is_admin && viewRole ? viewRole : user.role,
  };
  const allowed = (candidate: AppView) =>
    candidate === "overview" ||
    (candidate === "lh-request" &&
      (activeUser.role === "ops_pic" || activeUser.role === "fte_ops")) ||
    (candidate === "truck-request" && activeUser.role === "fte_mm") ||
    (candidate === "docking" && activeUser.role === "doc_officer") ||
    (candidate === "kpi" && activeUser.role === "fte_ops") ||
    (candidate === "users" &&
      (activeUser.role === "fte_ops" || activeUser.role === "fte_mm"));
  const requestedView = getAppView(location.pathname);
  const view = allowed(requestedView) ? requestedView : "overview";
  const [menuOpen, setMenuOpen] = useState(false);
  const queue = useQueueNotifications(activeUser);

  async function switchRole(role: Role) {
    setViewRole(role);
    routerNavigate(getAppPath("overview"));
    await queryClient.invalidateQueries();
  }

  function navigate(next: AppView, replace = false) {
    if (!allowed(next)) next = "overview";
    const path = getAppPath(next);
    routerNavigate(path, { replace });
  }

  useEffect(() => {
    if (location.pathname !== getAppPath(view))
      routerNavigate(getAppPath(view), { replace: true });
  }, [location.pathname, routerNavigate, view]);

  return (
    <div className="app-shell">
      <AppSidebar
        user={activeUser}
        activeView={view}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onNavigate={navigate}
        onSignOut={() => void supabase.auth.signOut()}
        pendingCount={queue.count}
      />
      <main className="app-content" aria-label="Primary content">
        <div className="app-content-inner">
          <AppHeader
            user={activeUser}
            preview={preview}
            view={view}
            onRoleChange={switchRole}
            onSearch={() =>
              navigate(
                activeUser.role === "fte_mm" ? "truck-request" : "lh-request",
              )
            }
          />
          <section className="app-workspace" aria-live="polite">
            <Suspense fallback={<ViewLoading view={view} />}>
              {view === "overview" && (
                <Overview
                  user={activeUser}
                  onNavigate={navigate}
                  preview={preview}
                />
              )}
              {view === "lh-request" && (
                <OutboundRequests user={activeUser} queue={queue} />
              )}
              {view === "truck-request" && (
                <MidmileRequests user={activeUser} queue={queue} />
              )}
              {view === "docking" && <DockingConfirmation user={activeUser} />}
              {view === "kpi" && <Kpi />}
              {view === "users" && <UserManagement />}
            </Suspense>
          </section>
        </div>
      </main>
    </div>
  );
}

function ViewLoading({ view }: { view: AppView }) {
  if (view === "overview") {
    return (
      <div className="workspace-view dashboard-view">
        <section className="overview-metrics" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="metric-card">
              <span className="metric-card-top">
                <span className="metric-icon">
                  <span
                    className="skeleton-line skeleton-line--head"
                    style={{ width: 18, height: 18, borderRadius: 999 }}
                  />
                </span>
                <span className="skeleton-chip" />
              </span>
              <span className="metric-copy">
                <span
                  className="skeleton-line skeleton-line--head"
                  style={{ width: 88, marginBottom: 10 }}
                />
                <span
                  className="skeleton-line"
                  style={{ width: 64, height: 26 }}
                />
              </span>
              <span className="metric-foot">
                <span className="skeleton-line" style={{ width: 140 }} />
              </span>
            </div>
          ))}
        </section>
        <section className="intraday-shell" aria-hidden="true">
          <article className="intraday-card">
            <div className="intraday-head">
              <div>
                <span
                  className="skeleton-line skeleton-line--head"
                  style={{ width: 150 }}
                />
                <span
                  className="skeleton-line"
                  style={{ width: 220, marginTop: 10 }}
                />
              </div>
              <div className="intraday-filters">
                <span className="skeleton-chip" />
                <span className="skeleton-chip" />
                <span className="skeleton-chip" />
              </div>
            </div>
            <div className="line-chart top-dispatch-line-chart">
              <SkeletonTable columns={2} rows={3} compact />
            </div>
          </article>
        </section>
        <section className="dashboard-grid">
          <article className="panel chart-panel truck-mix-panel">
            <div className="panel-head compact">
              <div>
                <span
                  className="skeleton-line skeleton-line--head"
                  style={{ width: 110 }}
                />
                <span
                  className="skeleton-line"
                  style={{ width: 160, marginTop: 10 }}
                />
              </div>
            </div>
            <div className="table-loading-shell">
              <SkeletonTable columns={2} rows={3} compact />
            </div>
          </article>
          <article className="panel dashboard-list-panel dashboard-list-panel--trips">
            <div className="panel-head compact">
              <div>
                <span
                  className="skeleton-line skeleton-line--head"
                  style={{ width: 120 }}
                />
                <span
                  className="skeleton-line"
                  style={{ width: 180, marginTop: 10 }}
                />
              </div>
            </div>
            <div className="dashboard-list">
              <SkeletonTable columns={4} rows={4} compact />
            </div>
          </article>
          <article className="panel dashboard-list-panel">
            <div className="panel-head compact">
              <div>
                <span
                  className="skeleton-line skeleton-line--head"
                  style={{ width: 120 }}
                />
                <span
                  className="skeleton-line"
                  style={{ width: 180, marginTop: 10 }}
                />
              </div>
            </div>
            <div className="dashboard-list">
              <SkeletonTable columns={4} rows={4} compact />
            </div>
          </article>
        </section>
      </div>
    );
  }

  return (
    <div className="workspace-view">
      <div className="table-loading-shell">
        <div className="table-loading-toolbar">
          <span className="skeleton-chip" />
          <span className="skeleton-chip" />
          <span className="skeleton-chip" />
        </div>
        <SkeletonTable columns={14} rows={5} />
      </div>
    </div>
  );
}
