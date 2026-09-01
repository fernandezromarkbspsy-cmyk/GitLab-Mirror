import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Bell, Check, ChevronDown, ChevronRight, Mail, Search, ShieldCheck, SlidersHorizontal, UserCircle, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useUiStore } from '../stores/ui';
const roles = [{ value: 'fte_ops', label: 'FTE Ops' }, { value: 'fte_mm', label: 'FTE Midmile' }, { value: 'ops_pic', label: 'Ops PIC' }, { value: 'doc_officer', label: 'Document Officer' }, { value: 'dock_officer', label: 'Dock Officer' }];
const page = {
    overview: { name: 'Dashboard', section: 'Overview' },
    'lh-request': { name: 'LH Request', section: 'Outbound' },
    'truck-request': { name: 'Truck Request', section: 'Midmile' },
    docking: { name: 'Docking Confirmation', section: 'Docking' },
    kpi: { name: 'KPI Analytics', section: 'Performance' },
    users: { name: 'User Management', section: 'Administration' },
};
function formatDate(value) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}
export function AppHeader({ user, view, onRoleChange, onSearch }) {
    const client = useQueryClient();
    const [open, setOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [mailOpen, setMailOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const search = useUiStore(state => state.search);
    const setSearch = useUiStore(state => state.setSearch);
    const setDateRange = useUiStore(state => state.setDateRange);
    const resetDateRange = useUiStore(state => state.resetDateRange);
    const searchRef = useRef(null);
    const notificationButtonRef = useRef(null);
    const profileButtonRef = useRef(null);
    const notificationMenuRef = useRef(null);
    const filterMenuRef = useRef(null);
    const mailMenuRef = useRef(null);
    const profileMenuRef = useRef(null);
    const knownNotification = useRef(null);
    const notificationMenuId = useId();
    const profileMenuId = useId();
    const [toast, setToast] = useState(null);
    const notifications = useQuery({ queryKey: ['notifications', user.role], queryFn: () => api('/notifications'), refetchInterval: 5_000 });
    const read = useMutation({ mutationFn: (id) => api(`/notifications/${id}/read`, { method: 'PATCH' }), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
    const readAll = useMutation({ mutationFn: () => api('/notifications/read-all', { method: 'PATCH' }), onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
    const count = notifications.data?.unread ?? 0;
    const alerts = notifications.data?.data ?? [];
    useEffect(() => { const latest = alerts.find(item => !item.read_at); if (!latest)
        return; if (knownNotification.current === null) {
        knownNotification.current = latest.id;
        return;
    } if (latest.id !== knownNotification.current) {
        knownNotification.current = latest.id;
        setToast(latest);
        window.setTimeout(() => setToast(null), 5000);
        void client.invalidateQueries({ queryKey: ['requests'] });
        void client.invalidateQueries({ queryKey: ['kpi'] });
        const AudioContextClass = window.AudioContext;
        if (AudioContextClass) {
            const context = new AudioContextClass();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.frequency.value = 880;
            gain.gain.value = .08;
            oscillator.connect(gain).connect(context.destination);
            oscillator.start();
            oscillator.stop(context.currentTime + .18);
        }
    } }, [alerts, client]);
    useEffect(() => {
        const focusSearch = (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
            event.preventDefault();
            searchRef.current?.focus();
        } };
        window.addEventListener('keydown', focusSearch);
        return () => window.removeEventListener('keydown', focusSearch);
    }, []);
    useEffect(() => {
        if (!open && !filterOpen && !mailOpen && !profileOpen)
            return;
        function handlePointerDown(event) {
            const target = event.target;
            if (open && notificationMenuRef.current && !notificationMenuRef.current.contains(target) && !notificationButtonRef.current?.contains(target)) {
                setOpen(false);
            }
            if (filterOpen && filterMenuRef.current && !filterMenuRef.current.contains(target))
                setFilterOpen(false);
            if (mailOpen && mailMenuRef.current && !mailMenuRef.current.contains(target))
                setMailOpen(false);
            if (profileOpen && profileMenuRef.current && !profileMenuRef.current.contains(target) && !profileButtonRef.current?.contains(target)) {
                setProfileOpen(false);
            }
        }
        function handleEscape(event) {
            if (event.key !== 'Escape')
                return;
            if (open) {
                setOpen(false);
                notificationButtonRef.current?.focus();
            }
            if (profileOpen) {
                setProfileOpen(false);
                profileButtonRef.current?.focus();
            }
        }
        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [filterOpen, mailOpen, open, profileOpen]);
    const searchPlaceholder = view === 'overview'
        ? 'Search requests, then press Enter'
        : `Search ${page[view].section.toLowerCase()} requests, then press Enter`;
    return _jsxs("header", { className: "app-topbar", children: [toast && _jsxs("div", { className: "app-toast", role: "status", children: [_jsx(Bell, { size: 17 }), _jsxs("div", { children: [_jsx("strong", { children: toast.title }), _jsx("span", { children: toast.body })] })] }), _jsx("div", { className: "topbar-page", children: _jsxs("div", { className: "topbar-page-copy", children: [_jsx("h1", { children: page[view].name }), _jsxs("nav", { className: "topbar-breadcrumbs", "aria-label": "Breadcrumb", children: [_jsx("span", { className: "breadcrumb-root", children: "Operations" }), _jsx(ChevronRight, { size: 12, "aria-hidden": "true" }), _jsx("span", { className: "breadcrumb-current", "aria-current": "page", children: page[view].section })] })] }) }), _jsxs("div", { className: "topbar-tools", children: [_jsxs("form", { className: "topbar-search", onSubmit: event => { event.preventDefault(); if (search.trim())
                            onSearch(); }, children: [_jsx(Search, { size: 17 }), _jsx("input", { ref: searchRef, "aria-label": `Search requests in ${page[view].section}`, placeholder: searchPlaceholder, title: searchPlaceholder, value: search, onChange: e => setSearch(e.target.value) }), _jsx("kbd", { children: "Ctrl F" })] }), _jsxs("div", { ref: filterMenuRef, className: "topbar-menu-wrap", children: [_jsx("button", { className: `top-icon-button ${filterOpen ? 'selected' : ''}`, type: "button", onClick: () => setFilterOpen(value => !value), "aria-label": "Filter dashboard", "aria-expanded": filterOpen, children: _jsx(SlidersHorizontal, { size: 19 }) }), filterOpen && _jsxs("section", { className: "topbar-popover filter-popover", role: "menu", "aria-label": "Dashboard filters", children: [_jsx("strong", { children: "Quick filters" }), _jsxs("button", { type: "button", role: "menuitem", onClick: () => { const end = new Date(); const start = new Date(end); start.setDate(start.getDate() - 29); setDateRange(formatDate(start), formatDate(end)); setFilterOpen(false); }, children: ["Last 30 days ", _jsx("span", { children: "\u2713" })] }), _jsxs("button", { type: "button", role: "menuitem", onClick: () => { resetDateRange(); setFilterOpen(false); }, children: ["All requests ", _jsx("span", { children: "\u2713" })] }), _jsxs("button", { type: "button", role: "menuitem", onClick: () => { setSearch(''); resetDateRange(); setFilterOpen(false); }, children: ["Clear filters ", _jsx(X, { size: 13 })] })] })] }), _jsxs("div", { className: "notification-menu", children: [_jsxs("button", { ref: notificationButtonRef, className: "top-icon-button notification-button", type: "button", title: "Notifications", "aria-label": `Open notifications, ${count} unread`, "aria-expanded": open, "aria-controls": notificationMenuId, onClick: () => { setOpen(value => !value); setMailOpen(false); setFilterOpen(false); }, children: [_jsx(Bell, { size: 19 }), count > 0 && _jsx("span", { children: count > 99 ? '99+' : count })] }), open && _jsxs("section", { ref: notificationMenuRef, id: notificationMenuId, className: "notification-popover", role: "menu", "aria-label": "Notifications", children: [_jsxs("div", { children: [_jsx("strong", { children: "Notifications" }), count > 0 ? _jsx("button", { className: "text-button", type: "button", onClick: () => readAll.mutate(), children: "Mark all read" }) : _jsx("span", { children: "0" })] }), alerts.length ? _jsx("div", { className: "notification-list", children: alerts.slice(0, 6).map(item => _jsxs("button", { className: item.read_at ? '' : 'unread', type: "button", role: "menuitem", onClick: () => { if (!item.read_at)
                                                read.mutate(item.id); setOpen(false); notificationButtonRef.current?.focus(); }, children: [_jsx("span", { children: item.title }), _jsx("small", { children: item.body })] }, item.id)) }) : _jsx("p", { children: "No notifications." })] })] }), _jsxs("div", { ref: mailMenuRef, className: "topbar-menu-wrap", children: [_jsxs("button", { className: "top-icon-button mail-button", type: "button", onClick: () => { setMailOpen(value => !value); setOpen(false); setFilterOpen(false); }, "aria-label": "Messages", "aria-expanded": mailOpen, children: [_jsx(Mail, { size: 19 }), count > 0 && _jsx("i", { className: "badge-dot mail-dot" })] }), mailOpen && _jsxs("section", { className: "notification-popover mail-popover", role: "menu", "aria-label": "Messages", children: [_jsxs("div", { children: [_jsx("strong", { children: "Messages" }), _jsxs("span", { className: "popover-count", children: [count, " new"] })] }), alerts.length ? _jsx("div", { className: "notification-list", children: alerts.slice(0, 6).map(item => _jsxs("button", { className: item.read_at ? '' : 'unread', type: "button", role: "menuitem", onClick: () => { if (!item.read_at)
                                                read.mutate(item.id); setMailOpen(false); }, children: [_jsx(Mail, { size: 14 }), _jsx("span", { children: item.title }), _jsx("small", { children: item.body })] }, item.id)) }) : _jsx("p", { children: "No new messages." }), count > 0 && _jsx("button", { className: "text-button popover-footer-action", type: "button", onClick: () => { readAll.mutate(); setMailOpen(false); }, children: "Mark all read" })] })] }), user.is_admin && _jsxs("div", { className: "profile-switcher", children: [_jsxs("button", { ref: profileButtonRef, className: "topbar-user", type: "button", "aria-expanded": profileOpen, "aria-controls": profileMenuId, onClick: () => setProfileOpen(value => !value), children: [_jsx(UserCircle, { size: 22 }), _jsxs("div", { children: [_jsx("strong", { children: user.name }), _jsx("small", { children: user.is_admin ? 'Administrator' : user.role.replaceAll('_', ' ') })] }), _jsx(ChevronDown, { size: 14, className: "topbar-user-chevron" })] }), profileOpen && _jsxs("section", { ref: profileMenuRef, id: profileMenuId, className: "profile-menu", role: "menu", "aria-label": "Profile", children: [_jsxs("header", { children: [_jsx(ShieldCheck, { size: 18 }), _jsxs("div", { children: [_jsx("strong", { children: "Test role view" }), _jsx("small", { children: "Admin access remains enabled" })] })] }), user.is_admin ? roles.map(role => _jsxs("button", { type: "button", role: "menuitem", onClick: () => { setProfileOpen(false); void onRoleChange(role.value); profileButtonRef.current?.focus(); }, children: [_jsx("span", { children: role.label }), user.role === role.value && _jsx(Check, { size: 16 })] }, role.value)) : _jsxs("p", { children: ["Signed in as ", user.role.replaceAll('_', ' ')] })] })] })] })] });
}
