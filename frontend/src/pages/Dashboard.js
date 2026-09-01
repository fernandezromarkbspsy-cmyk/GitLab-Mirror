import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Suspense, lazy, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppHeader } from '../components/AppHeader';
import { AppSidebar } from '../components/AppSidebar';
import { SkeletonTable } from '../components/SkeletonTable';
import { useQueueNotifications } from '../hooks/useQueueNotifications';
import { supabase } from '../lib/supabase';
import { useUiStore } from '../stores/ui';
const Overview = lazy(() => import('./Overview').then(module => ({ default: module.Overview })));
const OutboundRequests = lazy(() => import('./OutboundRequests').then(module => ({ default: module.OutboundRequests })));
const MidmileRequests = lazy(() => import('./MidmileRequests').then(module => ({ default: module.MidmileRequests })));
const DockingConfirmation = lazy(() => import('./DockingConfirmation').then(module => ({ default: module.DockingConfirmation })));
const Kpi = lazy(() => import('./Kpi').then(module => ({ default: module.Kpi })));
const UserManagement = lazy(() => import('./UserManagement').then(module => ({ default: module.UserManagement })));
export function Dashboard({ user }) {
    const queryClient = useQueryClient();
    const viewRole = useUiStore(state => state.viewRole);
    const setViewRole = useUiStore(state => state.setViewRole);
    const activeUser = { ...user, role: user.is_admin && viewRole ? viewRole : user.role };
    const allowed = (candidate) => candidate === 'overview' || (candidate === 'lh-request' && (activeUser.role === 'ops_pic' || activeUser.role === 'fte_ops')) || (candidate === 'truck-request' && activeUser.role === 'fte_mm') || (candidate === 'docking' && (activeUser.role === 'doc_officer' || activeUser.role === 'dock_officer')) || (candidate === 'kpi' && activeUser.role === 'fte_ops') || (candidate === 'users' && (activeUser.role === 'fte_ops' || activeUser.role === 'fte_mm'));
    const fromPath = () => ({ '/outbound/lh-request': 'lh-request', '/midmile/truck-request': 'truck-request', '/docking': 'docking', '/kpi': 'kpi', '/users': 'users' }[window.location.pathname] ?? 'overview');
    const [view, setView] = useState(() => allowed(fromPath()) ? fromPath() : 'overview');
    const [menuOpen, setMenuOpen] = useState(false);
    const queue = useQueueNotifications(activeUser);
    async function switchRole(role) {
        setViewRole(role);
        setView('overview');
        window.history.pushState({}, '', '/dashboard');
        await queryClient.invalidateQueries();
    }
    function navigate(next, replace = false) {
        if (!allowed(next))
            next = 'overview';
        const paths = { overview: '/dashboard', 'lh-request': '/outbound/lh-request', 'truck-request': '/midmile/truck-request', docking: '/docking', kpi: '/kpi', users: '/users' };
        const path = paths[next];
        window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
        setView(next);
    }
    useEffect(() => {
        navigate(view, true);
        const onPopState = () => setView(allowed(fromPath()) ? fromPath() : 'overview');
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);
    return _jsxs("div", { className: "app-shell", children: [_jsx(AppSidebar, { user: activeUser, activeView: view, open: menuOpen, onOpenChange: setMenuOpen, onNavigate: navigate, onSignOut: () => void supabase.auth.signOut(), pendingCount: queue.count }), _jsx("main", { className: "app-content", "aria-label": "Primary content", children: _jsxs("div", { className: "app-content-inner", children: [_jsx(AppHeader, { user: activeUser, view: view, onRoleChange: switchRole, onSearch: () => navigate(activeUser.role === 'fte_mm' ? 'truck-request' : 'lh-request') }), _jsx("section", { className: "app-workspace", "aria-live": "polite", children: _jsxs(Suspense, { fallback: _jsx(ViewLoading, { view: view }), children: [view === 'overview' && _jsx(Overview, { user: activeUser, onNavigate: navigate }), view === 'lh-request' && _jsx(OutboundRequests, { user: activeUser, queue: queue }), view === 'truck-request' && _jsx(MidmileRequests, { user: activeUser, queue: queue }), view === 'docking' && _jsx(DockingConfirmation, { user: activeUser }), view === 'kpi' && _jsx(Kpi, {}), view === 'users' && _jsx(UserManagement, {})] }) })] }) })] });
}
function ViewLoading({ view }) {
    if (view === 'overview') {
        return _jsxs("div", { className: "workspace-view dashboard-view", children: [_jsx("section", { className: "overview-metrics", "aria-hidden": "true", children: Array.from({ length: 4 }).map((_, index) => _jsxs("div", { className: "metric-card", children: [_jsxs("span", { className: "metric-card-top", children: [_jsx("span", { className: "metric-icon", children: _jsx("span", { className: "skeleton-line skeleton-line--head", style: { width: 18, height: 18, borderRadius: 999 } }) }), _jsx("span", { className: "skeleton-chip" })] }), _jsxs("span", { className: "metric-copy", children: [_jsx("span", { className: "skeleton-line skeleton-line--head", style: { width: 88, marginBottom: 10 } }), _jsx("span", { className: "skeleton-line", style: { width: 64, height: 26 } })] }), _jsx("span", { className: "metric-foot", children: _jsx("span", { className: "skeleton-line", style: { width: 140 } }) })] }, index)) }), _jsx("section", { className: "intraday-shell", "aria-hidden": "true", children: _jsxs("article", { className: "intraday-card", children: [_jsxs("div", { className: "intraday-head", children: [_jsxs("div", { children: [_jsx("span", { className: "skeleton-line skeleton-line--head", style: { width: 150 } }), _jsx("span", { className: "skeleton-line", style: { width: 220, marginTop: 10 } })] }), _jsxs("div", { className: "intraday-filters", children: [_jsx("span", { className: "skeleton-chip" }), _jsx("span", { className: "skeleton-chip" }), _jsx("span", { className: "skeleton-chip" })] })] }), _jsx("div", { className: "line-chart top-dispatch-line-chart", children: _jsx(SkeletonTable, { columns: 2, rows: 3, compact: true }) })] }) }), _jsxs("section", { className: "dashboard-grid", children: [_jsxs("article", { className: "panel chart-panel truck-mix-panel", children: [_jsx("div", { className: "panel-head compact", children: _jsxs("div", { children: [_jsx("span", { className: "skeleton-line skeleton-line--head", style: { width: 110 } }), _jsx("span", { className: "skeleton-line", style: { width: 160, marginTop: 10 } })] }) }), _jsx("div", { className: "table-loading-shell", children: _jsx(SkeletonTable, { columns: 2, rows: 3, compact: true }) })] }), _jsxs("article", { className: "panel dashboard-list-panel dashboard-list-panel--trips", children: [_jsx("div", { className: "panel-head compact", children: _jsxs("div", { children: [_jsx("span", { className: "skeleton-line skeleton-line--head", style: { width: 120 } }), _jsx("span", { className: "skeleton-line", style: { width: 180, marginTop: 10 } })] }) }), _jsx("div", { className: "dashboard-list", children: _jsx(SkeletonTable, { columns: 4, rows: 4, compact: true }) })] }), _jsxs("article", { className: "panel dashboard-list-panel", children: [_jsx("div", { className: "panel-head compact", children: _jsxs("div", { children: [_jsx("span", { className: "skeleton-line skeleton-line--head", style: { width: 120 } }), _jsx("span", { className: "skeleton-line", style: { width: 180, marginTop: 10 } })] }) }), _jsx("div", { className: "dashboard-list", children: _jsx(SkeletonTable, { columns: 4, rows: 4, compact: true }) })] })] })] });
    }
    return _jsx("div", { className: "workspace-view", children: _jsxs("div", { className: "table-loading-shell", children: [_jsxs("div", { className: "table-loading-toolbar", children: [_jsx("span", { className: "skeleton-chip" }), _jsx("span", { className: "skeleton-chip" }), _jsx("span", { className: "skeleton-chip" })] }), _jsx(SkeletonTable, { columns: 14, rows: 5 })] }) });
}
