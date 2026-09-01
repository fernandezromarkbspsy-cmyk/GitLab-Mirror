import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronsUpDown, CircleDot, Clipboard, Clock3, Copy, Hash, Landmark, ListChecks, Truck, UserRound } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { Skiper87 } from './ui/skiper-ui/skiper87';
const columns = [
    { key: 'status', sortKey: 'status', label: 'Status', icon: CircleDot, render: request => _jsx(StatusBadge, { status: request.status }) },
    { key: 'request_timestamp', sortKey: 'request_timestamp', label: 'Request ts', icon: Clock3, render: request => formatDateTime(request.request_timestamp) },
    { key: 'cluster', sortKey: 'cluster', label: 'Cluster', icon: Landmark, render: request => _jsx(ClusterCell, { request: request }) },
    { key: 'dock_no', sortKey: 'dock_no', label: 'Dock #', icon: Truck, render: request => request.dock_no },
    { key: 'backlogs', sortKey: 'backlogs', label: 'Backlogs', icon: ListChecks, render: request => request.backlogs.toLocaleString() },
    { key: 'ob_fte', label: 'Ops FTE', icon: UserRound, render: request => empty(request.ob_fte) },
    { key: 'linehaul_trip_no', label: 'LHTrip #', icon: Clipboard, render: request => _jsx(TripCopyCell, { request: request }) },
    { key: 'plate_number', sortKey: 'plate_number', label: 'Plate #', icon: Hash, render: request => empty(request.plate_number) },
    { key: 'mm_fte', label: 'FTE MM', icon: UserRound, render: request => empty(request.created_by) },
    { key: 'truck_size', label: 'Truck Size', icon: Truck, render: request => empty(request.truck_size) },
    { key: 'truck_type', label: 'Truck Type', icon: Truck, render: request => empty(request.truck_type) },
    { key: 'provide_time', label: 'Provide TS', icon: Clock3, render: request => formatDateTime(request.provide_time) },
    { key: 'docked_time', label: 'Docked TS', icon: Clock3, render: request => formatDateTime(request.docked_time) },
    { key: 'doc_officer', label: 'DOC Officer', icon: UserRound, render: request => empty(request.created_by) },
];
export function RequestTable({ rows, actions, emptyMessage = 'No requests found.', emptyAction, sort, direction, onSort, visibleColumns }) {
    const [expandedId, setExpandedId] = useState(null);
    if (!rows.length)
        return _jsxs("div", { className: "empty-state", children: [_jsx("strong", { children: "No requests" }), _jsx("p", { children: emptyMessage }), emptyAction && _jsx("div", { className: "empty-state-actions", children: emptyAction })] });
    const visibleSet = visibleColumns ? new Set(visibleColumns) : null;
    const renderedColumns = visibleSet ? columns.filter(column => visibleSet.has(column.key)) : columns;
    function heading(column) {
        const content = _jsxs("span", { className: "table-header-label", children: [_jsx(column.icon, { size: 14 }), column.label] });
        if (!onSort || !column.sortKey)
            return content;
        const active = sort === column.sortKey;
        const Icon = active ? direction === 'asc' ? ArrowUp : ArrowDown : ChevronsUpDown;
        return _jsxs("button", { className: `sort-button ${active ? 'is-active' : ''}`, type: "button", onClick: () => onSort(column.sortKey), children: [content, _jsx(Icon, { size: 13 })] });
    }
    return _jsx("div", { className: "table-wrap request-table-wrap", children: _jsx(Skiper87, { className: "request-table-scroll", children: _jsxs("table", { className: "request-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: _jsx("span", { className: "sr-only", children: "Expand" }) }), renderedColumns.map(column => _jsx("th", { className: `request-column request-column--${column.key}`, children: heading(column) }, column.key)), actions && _jsx("th", { children: _jsx("span", { className: "sr-only", children: "Actions" }) })] }) }), _jsx("tbody", { children: rows.map(request => {
                            const expanded = expandedId === request.id;
                            const detailId = `request-detail-${request.id}`;
                            return _jsxs(Fragment, { children: [_jsxs("tr", { className: "request-row", "aria-expanded": expanded, children: [_jsx("td", { className: "request-column request-column--expand", "data-label": "Expand", children: _jsx("button", { type: "button", className: "expand-button", "aria-expanded": expanded, "aria-controls": detailId, "aria-label": `${expanded ? 'Collapse' : 'Expand'} request ${request.id}`, onClick: () => setExpandedId(value => value === request.id ? null : request.id), children: _jsx(ChevronDown, { size: 15 }) }) }), renderedColumns.map(column => _jsx("td", { className: `request-column request-column--${column.key}`, "data-label": column.label, children: column.render(request) }, column.key)), actions && _jsx("td", { className: "request-column request-column--actions", "data-label": "Actions", children: _jsx("div", { className: "row-actions", children: actions(request) }) })] }), expanded && _jsx("tr", { className: "request-detail-row", id: detailId, children: _jsx("td", { colSpan: renderedColumns.length + (actions ? 2 : 1), children: _jsx(RequestDetails, { request: request }) }) })] }, request.id);
                        }) })] }) }) });
}
function empty(value) {
    return value?.trim() ? value : '-';
}
function formatDateTime(value) {
    if (!value)
        return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
function ClusterCell({ request }) {
    const value = empty(request.cluster);
    const label = value === '-' ? '-' : `SOC 5 > ${value}`;
    return _jsx("div", { className: "cluster-cell", title: value === '-' ? undefined : value, children: _jsx("span", { className: "cluster-cell-value", children: label }) });
}
function TripCopyCell({ request }) {
    const [copied, setCopied] = useState(false);
    const value = empty(request.linehaul_trip_no);
    if (value === '-') {
        return _jsx("span", { className: "trip-value", children: "-" });
    }
    return _jsxs("div", { className: "trip-cell", children: [_jsx("button", { type: "button", className: `inline-icon-button ${copied ? 'is-copied' : ''}`, onClick: async (event) => {
                    event.stopPropagation();
                    if (!request.linehaul_trip_no)
                        return;
                    try {
                        await navigator.clipboard.writeText(request.linehaul_trip_no);
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1400);
                    }
                    catch (error) {
                        console.error('Unable to copy trip number', error);
                    }
                }, "aria-label": "Copy linehaul trip number", title: "Copy linehaul trip number", children: copied ? _jsx(Check, { size: 13 }) : _jsx(Copy, { size: 13 }) }), _jsx("span", { className: "trip-value", children: value })] });
}
function RequestDetails({ request }) {
    const fields = [
        ['Request ID', request.id],
        ['Created By', request.created_by],
        ['Created At', formatDateTime(request.created_at)],
        ['Updated At', formatDateTime(request.updated_at)],
        ['Driver ID', empty(request.driver_id)],
        ['Rejection Remarks', empty(request.rejection_remarks)],
    ];
    return _jsx("div", { className: "request-detail-grid", children: fields.map(([label, value]) => _jsxs("div", { children: [_jsx("span", { children: label }), _jsx("strong", { children: value })] }, label)) });
}
