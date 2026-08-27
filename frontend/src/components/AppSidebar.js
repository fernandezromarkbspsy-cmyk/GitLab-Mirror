import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart3, ChevronRight, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Route, ShipWheel, Truck, Users, } from "lucide-react";
import { useEffect, useState } from "react";
const roleNames = {
    ops_pic: "Ops PIC",
    fte_ops: "FTE Ops",
    fte_mm: "FTE Midmile",
    doc_officer: "Document Officer",
    dock_officer: "Dock Officer",
};
function groupForView(view) {
    if (view === "lh-request")
        return "outbound";
    if (view === "truck-request")
        return "midmile";
    return null;
}
export function AppSidebar({ user, activeView, open, onOpenChange, onNavigate, onSignOut, pendingCount, }) {
    const showOutbound = user.role === "ops_pic" || user.role === "fte_ops";
    const showMidmile = user.role === "fte_mm";
    const showDocking = user.role === "doc_officer" || user.role === "dock_officer";
    const showKpi = user.role === "fte_ops";
    const showUsers = user.role === "fte_ops" || user.role === "fte_mm";
    const [expanded, setExpanded] = useState(() => groupForView(activeView));
    const [hoveredGroup, setHoveredGroup] = useState(null);
    useEffect(() => {
        setExpanded(groupForView(activeView));
    }, [activeView]);
    const visibleGroup = hoveredGroup ?? expanded;
    function toggleGroup(group) {
        setExpanded((value) => (value === group ? null : group));
        setHoveredGroup(null);
    }
    function navigate(view) {
        onNavigate(view);
        onOpenChange(false);
    }
    return (_jsxs(_Fragment, { children: [_jsxs("button", { className: "mobile-nav-toggle", type: "button", title: "Open navigation", "aria-label": "Open navigation", onClick: () => onOpenChange(true), children: [_jsx(PanelLeftOpen, { size: 18 }), _jsx("span", { children: "Menu" })] }), _jsx("div", { className: `sidebar-scrim${open ? " is-open" : ""}`, onClick: () => onOpenChange(false) }), _jsxs("aside", { className: `app-sidebar${open ? " is-open" : ""}`, children: [_jsxs("div", { className: "sidebar-brand", children: [_jsx("div", { className: "sidebar-brand-mark", children: _jsx("img", { src: "/dashboard-icon/icon_logo.png", alt: "SOC 5" }) }), _jsxs("div", { className: "sidebar-brand-copy", children: [_jsx("strong", { className: "sidebar-brand-title", children: "SOC 5" }), _jsx("small", { className: "sidebar-brand-subtitle", children: "Outbound operations" })] }), _jsx("button", { className: "sidebar-close", type: "button", title: "Close navigation", "aria-label": "Close navigation", onClick: () => onOpenChange(false), children: _jsx(PanelLeftClose, { size: 17, strokeWidth: 2.2, "aria-hidden": "true" }) })] }), _jsxs("nav", { "aria-label": "Primary navigation", className: "sidebar-nav", children: [_jsxs("div", { className: "nav-section", children: [_jsx("p", { children: "Workspace" }), _jsxs("button", { className: `nav-link${activeView === "overview" ? " active" : ""}`, type: "button", onClick: () => navigate("overview"), children: [_jsx(LayoutDashboard, { size: 18 }), _jsx("span", { children: "Dashboard" })] })] }), showOutbound && (_jsxs("div", { className: "nav-section", onMouseEnter: () => setHoveredGroup("outbound"), onMouseLeave: () => setHoveredGroup(null), children: [_jsx("p", { children: "Outbound" }), _jsxs("button", { className: `nav-group-toggle${visibleGroup === "outbound" ? " is-open" : ""}`, type: "button", "aria-expanded": visibleGroup === "outbound", "aria-label": "Toggle outbound requests", onClick: () => toggleGroup("outbound"), children: [_jsx(Route, { size: 17 }), _jsx("span", { children: "Requests" }), _jsx(ChevronRight, { size: 15, className: "nav-group-chevron" })] }), visibleGroup === "outbound" && (_jsxs("button", { className: `nav-subitem${activeView === "lh-request" ? " active" : ""}`, onClick: () => navigate("lh-request"), children: [_jsx(Route, { size: 17 }), _jsx("span", { children: "LH Request" }), user.role === "fte_ops" && pendingCount > 0 && (_jsx("span", { className: "nav-badge", children: pendingCount > 99 ? "99+" : pendingCount }))] }))] })), showMidmile && (_jsxs("div", { className: "nav-section", onMouseEnter: () => setHoveredGroup("midmile"), onMouseLeave: () => setHoveredGroup(null), children: [_jsx("p", { children: "Midmile" }), _jsxs("button", { className: `nav-group-toggle${visibleGroup === "midmile" ? " is-open" : ""}`, type: "button", "aria-expanded": visibleGroup === "midmile", "aria-label": "Toggle midmile requests", onClick: () => toggleGroup("midmile"), children: [_jsx(Truck, { size: 17 }), _jsx("span", { children: "Requests" }), _jsx(ChevronRight, { size: 15, className: "nav-group-chevron" })] }), visibleGroup === "midmile" && (_jsxs("button", { className: `nav-subitem${activeView === "truck-request" ? " active" : ""}`, onClick: () => navigate("truck-request"), children: [_jsx(Truck, { size: 17 }), _jsx("span", { children: "Truck Request" }), pendingCount > 0 && (_jsx("span", { className: "nav-badge", children: pendingCount > 99 ? "99+" : pendingCount }))] }))] })), showDocking && (_jsxs("div", { className: "nav-section", children: [_jsx("p", { children: "Docking" }), _jsxs("button", { className: `nav-link${activeView === "docking" ? " active" : ""}`, onClick: () => navigate("docking"), children: [_jsx(ShipWheel, { size: 18 }), _jsx("span", { children: "Docking Confirmation" }), pendingCount > 0 && (_jsx("span", { className: "nav-badge", children: pendingCount }))] })] })), showKpi && (_jsxs("div", { className: "nav-section", children: [_jsx("p", { children: "Performance" }), _jsxs("button", { className: `nav-link${activeView === "kpi" ? " active" : ""}`, onClick: () => navigate("kpi"), children: [_jsx(BarChart3, { size: 18 }), _jsx("span", { children: "KPI Analytics" })] })] })), showUsers && (_jsxs("div", { className: "nav-section", children: [_jsx("p", { children: "Administration" }), _jsxs("button", { className: `nav-link${activeView === "users" ? " active" : ""}`, onClick: () => navigate("users"), children: [_jsx(Users, { size: 18 }), _jsx("span", { children: "User Management" })] })] }))] }), _jsxs("div", { className: "sidebar-account", children: [_jsx("div", { className: "account-avatar", "aria-hidden": "true", children: user.name.slice(0, 1).toUpperCase() }), _jsxs("div", { className: "sidebar-account-copy", children: [_jsx("strong", { children: user.name }), _jsx("small", { children: roleNames[user.role] })] }), _jsx("button", { type: "button", title: "Sign out", "aria-label": "Sign out", onClick: onSignOut, children: _jsx(LogOut, { size: 18 }) })] })] })] }));
}
