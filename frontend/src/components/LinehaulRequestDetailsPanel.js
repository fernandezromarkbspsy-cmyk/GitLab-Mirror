import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, CalendarDays, CheckCircle2, ClipboardCopy, ExternalLink, GripVertical, Hash, MapPin, Printer, Truck, UserRound, X } from 'lucide-react';
function valueOf(value) {
    return value?.trim() ? value : '-';
}
function formatDateTime(value) {
    if (!value)
        return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
export function LinehaulRequestDetailsPanel({ request, onClose, onNotice, position, onPositionChange }) {
    const panelRef = useRef(null);
    const dragRef = useRef(null);
    const [activeTab, setActiveTab] = useState('details');
    const status = request.status.replaceAll('_', ' ');
    useEffect(() => {
        const closeOnEscape = (event) => { if (event.key === 'Escape')
            onClose(); };
        const closeOnBackgroundClick = (event) => { if (panelRef.current && !panelRef.current.contains(event.target))
            onClose(); };
        document.addEventListener('keydown', closeOnEscape);
        document.addEventListener('pointerdown', closeOnBackgroundClick);
        return () => { document.removeEventListener('keydown', closeOnEscape); document.removeEventListener('pointerdown', closeOnBackgroundClick); };
    }, [onClose]);
    useEffect(() => {
        const movePanel = (event) => {
            if (!dragRef.current || event.pointerId !== dragRef.current.pointerId)
                return;
            const panel = panelRef.current;
            const workspace = panel?.parentElement;
            if (!panel || !workspace)
                return;
            const workspaceBounds = workspace.getBoundingClientRect();
            const panelBounds = panel.getBoundingClientRect();
            const scale = window.matchMedia('(min-width: 821px)').matches ? 0.75 : 1;
            const x = (event.clientX - workspaceBounds.left) / scale - dragRef.current.offsetX / scale;
            const y = (event.clientY - workspaceBounds.top) / scale - dragRef.current.offsetY / scale;
            onPositionChange({ x: Math.max(8, Math.min(x, workspaceBounds.width / scale - panelBounds.width / scale - 8)), y: Math.max(8, Math.min(y, workspaceBounds.height / scale - panelBounds.height / scale - 8)) });
        };
        const stopDragging = (event) => { if (dragRef.current?.pointerId === event.pointerId)
            dragRef.current = null; };
        window.addEventListener('pointermove', movePanel);
        window.addEventListener('pointerup', stopDragging);
        window.addEventListener('pointercancel', stopDragging);
        return () => { window.removeEventListener('pointermove', movePanel); window.removeEventListener('pointerup', stopDragging); window.removeEventListener('pointercancel', stopDragging); };
    }, [onPositionChange]);
    function startDragging(event) {
        if (event.target.closest('button'))
            return;
        const rect = panelRef.current?.getBoundingClientRect();
        if (!rect)
            return;
        dragRef.current = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
        event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    const tabs = [{ id: 'details', label: 'Request details' }, { id: 'activity', label: 'Activity' }, { id: 'docs', label: 'Docs' }];
    return _jsxs("section", { ref: panelRef, className: "lh-request-details-panel", style: { left: position.x, top: position.y }, "aria-label": `Details for request ${request.id}`, children: [_jsxs("header", { className: "lh-details-panel-header", onPointerDown: startDragging, children: [_jsxs("div", { className: "lh-details-panel-title", children: [_jsx(GripVertical, { className: "lh-details-panel-grip", size: 16, "aria-hidden": "true" }), _jsxs("div", { children: [_jsx("span", { className: "lh-details-panel-eyebrow", children: "Linehaul request" }), _jsx("strong", { children: request.id })] })] }), _jsxs("div", { className: "lh-details-panel-actions", children: [_jsx("button", { type: "button", "aria-label": "Open request in new view", onClick: () => onNotice(`Opening ${request.id}`), children: _jsx(ExternalLink, { size: 15 }) }), _jsx("button", { type: "button", "aria-label": "Close request details", onClick: onClose, children: _jsx(X, { size: 16 }) })] })] }), _jsxs("div", { className: "lh-details-panel-summary", children: [_jsx("div", { className: "lh-details-panel-avatar", "aria-hidden": "true", children: request.cluster.charAt(0) }), _jsxs("div", { className: "lh-details-panel-summary-copy", children: [_jsx("strong", { children: request.cluster }), _jsx("span", { children: request.region })] }), _jsx("span", { className: `lh-status lh-status-${request.status.toLowerCase()}`, children: status })] }), _jsx("div", { className: "lh-details-panel-tabs", role: "tablist", "aria-label": "Request detail sections", children: tabs.map(tab => _jsxs("button", { className: activeTab === tab.id ? 'active' : '', type: "button", role: "tab", "aria-selected": activeTab === tab.id, "aria-controls": `lh-panel-${tab.id}`, onClick: () => setActiveTab(tab.id), children: [tab.id === 'details' && _jsx(CheckCircle2, { size: 14 }), tab.label] }, tab.id)) }), activeTab === 'details' && _jsxs("dl", { id: "lh-panel-details", className: "lh-details-panel-fields", role: "tabpanel", children: [_jsxs("div", { children: [_jsxs("dt", { children: [_jsx(CalendarDays, { size: 14 }), "Request time"] }), _jsx("dd", { children: formatDateTime(request.request_timestamp) })] }), _jsxs("div", { children: [_jsxs("dt", { children: [_jsx(Hash, { size: 14 }), "Cluster"] }), _jsx("dd", { children: valueOf(request.cluster) })] }), _jsxs("div", { children: [_jsxs("dt", { children: [_jsx(MapPin, { size: 14 }), "Region"] }), _jsx("dd", { children: valueOf(request.region) })] }), _jsxs("div", { children: [_jsxs("dt", { children: [_jsx(Truck, { size: 14 }), "Dock #"] }), _jsx("dd", { children: valueOf(request.dock_no) })] }), _jsxs("div", { children: [_jsxs("dt", { children: [_jsx(Hash, { size: 14 }), "Backlogs"] }), _jsx("dd", { children: request.backlogs.toLocaleString() })] }), _jsxs("div", { children: [_jsxs("dt", { children: [_jsx(Truck, { size: 14 }), "LH size"] }), _jsx("dd", { children: valueOf(request.truck_size) })] }), _jsxs("div", { children: [_jsxs("dt", { children: [_jsx(UserRound, { size: 14 }), "SOC PIC"] }), _jsx("dd", { children: valueOf(request.ob_fte) })] }), _jsxs("div", { children: [_jsxs("dt", { children: [_jsx(Hash, { size: 14 }), "LH trip #"] }), _jsx("dd", { children: valueOf(request.linehaul_trip_no) })] }), _jsxs("div", { children: [_jsxs("dt", { children: [_jsx(Truck, { size: 14 }), "Plate #"] }), _jsx("dd", { children: valueOf(request.plate_number) })] })] }), activeTab === 'activity' && _jsxs("div", { id: "lh-panel-activity", className: "lh-details-panel-tab-content", role: "tabpanel", children: [_jsx(CheckCircle2, { size: 18 }), _jsx("strong", { children: "Request activity" }), _jsx("span", { children: "No activity has been recorded for this request." })] }), activeTab === 'docs' && _jsxs("div", { id: "lh-panel-docs", className: "lh-details-panel-tab-content", role: "tabpanel", children: [_jsx(ClipboardCopy, { size: 18 }), _jsx("strong", { children: "Request documents" }), _jsx("span", { children: "No documents are attached to this request." })] }), _jsxs("footer", { className: "lh-details-panel-footer", children: [_jsxs("button", { type: "button", onClick: () => onNotice(`Exporting ${request.id}`), children: [_jsx(ArrowUp, { size: 15 }), "Export"] }), _jsxs("button", { type: "button", onClick: () => { void navigator.clipboard?.writeText(request.id); onNotice(`Copied ${request.id}`); }, children: [_jsx(ClipboardCopy, { size: 15 }), "Copy ID"] }), _jsxs("button", { type: "button", onClick: () => window.print(), children: [_jsx(Printer, { size: 15 }), "Print"] })] })] });
}
