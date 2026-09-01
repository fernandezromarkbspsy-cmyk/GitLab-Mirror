import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, CheckCircle2, ChevronLeft, ChevronRight, CircleCheck, Clock3, Hash, ListChecks, MoreHorizontal, Tag, Truck, Users, X, XCircle } from 'lucide-react';
import { Modal } from '../components/Modal';
import { statuses } from '../components/RequestFilters';
import { RequestTable } from '../components/RequestTable';
import { SkeletonTable } from '../components/SkeletonTable';
import { api } from '../lib/api';
import { LinehaulFilterPanel } from '../components/LinehaulFilterPanel';
import { defaultRequestFilters, exportRequestsCsv, requestMetricsQueryString, requestQueryString } from '../lib/requests';
function formatDateTime(value) {
    if (!value)
        return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
function displayValue(value) {
    return value?.trim() ? value : '-';
}
export function MidmileRequests({ user, queue }) {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState(defaultRequestFilters);
    const deferredSearch = useDeferredValue(filters.search);
    const [selected, setSelected] = useState(null);
    const [notice, setNotice] = useState('');
    const [exporting, setExporting] = useState(false);
    const [openRow, setOpenRow] = useState(null);
    const appliedFilters = { ...filters, search: deferredSearch };
    const requests = useQuery({
        queryKey: ['requests', 'midmile-all', appliedFilters],
        queryFn: () => api(`/requests?${requestQueryString(appliedFilters)}`),
        placeholderData: previous => previous,
        enabled: user.role === 'fte_mm',
    });
    const metrics = useQuery({
        queryKey: ['request-metrics', 'midmile-all', { search: appliedFilters.search, dateFrom: appliedFilters.dateFrom, dateTo: appliedFilters.dateTo }],
        queryFn: () => api(`/requests/metrics?${requestMetricsQueryString(appliedFilters)}`),
        placeholderData: previous => previous,
        enabled: user.role === 'fte_mm',
    });
    const transition = useMutation({
        mutationFn: ({ request, action, payload }) => api(`/requests/${request.id}/${action}`, { method: 'POST', body: JSON.stringify(payload) }),
        onSuccess: async (_, variables) => { setSelected(null); setNotice(variables.action === 'assign-truck' ? 'Truck confirmed.' : 'Request returned to Outbound.'); await queryClient.invalidateQueries({ queryKey: ['requests'] }); await queryClient.invalidateQueries({ queryKey: ['request-metrics'] }); },
    });
    const actions = (request) => request.status === 'APPROVED' ? _jsxs(_Fragment, { children: [_jsxs("button", { className: "table-action assign", type: "button", onClick: () => setSelected({ request, action: 'assign-truck' }), children: [_jsx(CheckCircle2, { size: 15 }), "Assign"] }), _jsxs("button", { className: "table-action reject", type: "button", onClick: () => setSelected({ request, action: 'reject-mm' }), children: [_jsx(XCircle, { size: 15 }), "Reject"] })] }) : null;
    function sortBy(sort) { setFilters(value => ({ ...value, sort, direction: value.sort === sort && value.direction === 'asc' ? 'desc' : 'asc', page: 1 })); }
    async function exportCsv() {
        setExporting(true);
        setNotice('');
        try {
            await exportRequestsCsv(appliedFilters, `truck-requests-${new Date().toISOString().slice(0, 10)}.csv`);
        }
        catch (error) {
            setNotice(error instanceof Error ? error.message : 'CSV export failed.');
        }
        finally {
            setExporting(false);
        }
    }
    const statusSummary = statuses.map(status => ({ value: status, count: status === 'ALL' ? (metrics.data?.total ?? 0) : (metrics.data?.by_status?.[status] ?? 0) }));
    return _jsx("div", { className: `workspace-view lh-request-page${selected ? ' lh-drawer-open' : ''}`, "aria-label": "Linehaul request workspace", children: _jsxs("section", { className: "lh-request-workspace", "aria-label": "Midmile linehaul requests", children: [(notice || transition.error) && _jsx("p", { className: `notice${transition.error || notice.includes('failed') ? ' error' : ' success-notice'}`, children: transition.error?.message || notice }), _jsxs("section", { className: "panel data-panel queue-panel", children: [_jsxs("div", { children: [_jsxs("div", { className: "section-title", children: [_jsx("h2", { children: "Pending confirmation" }), queue.count > 0 && _jsx("span", { className: "count-badge", children: queue.count })] }), _jsx("p", { children: "Approved requests awaiting FTE Midmile confirmation" })] }), queue.isPending ? _jsxs("div", { className: "table-loading-shell", children: [_jsxs("div", { className: "table-loading-toolbar", children: [_jsx("span", { className: "skeleton-chip" }), _jsx("span", { className: "skeleton-chip" }), _jsx("span", { className: "skeleton-chip" })] }), _jsx(SkeletonTable, { columns: 4, rows: 4, compact: true })] }) : queue.error ? _jsx("p", { className: "state error", children: queue.error.message }) : queue.rows.length ? _jsx(RequestTable, { rows: queue.rows, actions: actions }) : _jsx("div", { className: "lh-empty-state", children: "No approved requests are awaiting confirmation." })] }), _jsx(LinehaulFilterPanel, { filters: filters, exporting: exporting, onChange: setFilters, onSort: sortBy, onExport: () => void exportCsv(), onNotice: setNotice }), _jsxs("section", { className: "lh-table-shell", "aria-label": "Midmile linehaul request records", children: [_jsx("div", { className: "lh-table-toolbar", children: _jsxs("div", { className: "lh-view-controls", children: [_jsx("button", { className: "lh-toolbar-icon", type: "button", "aria-label": "Refresh records", onClick: () => void requests.refetch(), children: _jsx(Clock3, { size: 16 }) }), _jsx("div", { className: "lh-view-tabs", children: _jsxs("button", { className: "selected", type: "button", children: [_jsx(BadgeCheck, { size: 15 }), "Table"] }) })] }) }), _jsxs("div", { className: "lh-records-table", role: "table", children: [_jsxs("div", { className: "lh-table-head lh-table-grid", role: "row", children: [_jsxs("span", { children: [_jsx(CircleCheck, { size: 14 }), "Status"] }), _jsxs("button", { type: "button", onClick: () => sortBy('request_timestamp'), children: [_jsx(Clock3, { size: 14 }), _jsx("span", { children: "Request Time" })] }), _jsxs("button", { type: "button", onClick: () => sortBy('cluster'), children: [_jsx(Hash, { size: 14 }), _jsx("span", { children: "Cluster" })] }), _jsxs("span", { children: [_jsx(BadgeCheck, { size: 14 }), "Region"] }), _jsxs("button", { type: "button", onClick: () => sortBy('dock_no'), children: [_jsx(Truck, { size: 14 }), _jsx("span", { children: "Dock #" })] }), _jsxs("button", { type: "button", onClick: () => sortBy('backlogs'), children: [_jsx(ListChecks, { size: 14 }), _jsx("span", { children: "Backlogs" })] }), _jsxs("span", { children: [_jsx(Truck, { size: 14 }), "LH Size"] }), _jsxs("span", { children: [_jsx(Users, { size: 14 }), "SOC PIC"] }), _jsxs("span", { children: [_jsx(Tag, { size: 14 }), "LH Trip #"] }), _jsxs("button", { type: "button", onClick: () => sortBy('plate_number'), children: [_jsx(Hash, { size: 14 }), _jsx("span", { children: "Plate #" })] }), _jsx("span", {})] }), _jsxs("div", { className: "lh-table-body", children: [requests.isPending && _jsx("div", { className: "lh-empty-state", children: "Loading live requests..." }), requests.error && _jsx("div", { className: "lh-empty-state", children: requests.error.message }), !requests.isPending && !requests.error && (requests.data?.data ?? []).map((row, index) => _jsxs("div", { className: "lh-table-row lh-table-grid", role: "row", tabIndex: 0, style: { '--row-index': index }, children: [_jsx("span", { children: _jsx("span", { className: `lh-status lh-status-${row.status.toLowerCase()}`, children: row.status.replaceAll('_', ' ') }) }), _jsx("span", { children: formatDateTime(row.request_timestamp) }), _jsx("span", { title: row.cluster, children: row.cluster }), _jsx("span", { children: row.region }), _jsx("span", { children: row.dock_no }), _jsx("span", { children: row.backlogs.toLocaleString() }), _jsx("span", { children: row.truck_size }), _jsx("span", { children: displayValue(row.ob_fte) }), _jsx("span", { children: displayValue(row.linehaul_trip_no) }), _jsx("span", { children: displayValue(row.plate_number) }), _jsxs("span", { className: "lh-row-menu-wrap", children: [_jsx("button", { className: "lh-row-more", type: "button", "aria-label": `Actions for request ${row.id}`, onClick: event => { event.stopPropagation(); setOpenRow(openRow === row.id ? null : row.id); }, children: _jsx(MoreHorizontal, { size: 17 }) }), openRow === row.id && row.status === 'APPROVED' && _jsxs("span", { className: "lh-row-menu", children: [_jsx("button", { type: "button", onClick: () => { setSelected({ request: row, action: 'assign-truck' }); setOpenRow(null); }, children: "Assign" }), _jsx("button", { type: "button", onClick: () => { setSelected({ request: row, action: 'reject-mm' }); setOpenRow(null); }, children: "Reject" })] })] })] }, row.id)), !requests.isPending && !requests.error && (requests.data?.data ?? []).length === 0 && _jsx("div", { className: "lh-empty-state", children: "No live requests match the current filters." })] })] }), _jsxs("footer", { className: "lh-table-footer", children: [_jsx("span", { children: requests.data ? `Page ${requests.data.current_page} of ${requests.data.last_page}` : 'Page 1' }), _jsxs("div", { className: "lh-pagination", children: [_jsx("span", { children: "Show row" }), _jsxs("select", { value: String(filters.perPage), onChange: event => setFilters(current => ({ ...current, perPage: Number(event.target.value), page: 1 })), children: [_jsx("option", { value: "8", children: "8" }), _jsx("option", { value: "10", children: "10" }), _jsx("option", { value: "20", children: "20" })] }), _jsx("button", { type: "button", disabled: !requests.data || requests.data.current_page <= 1, "aria-label": "Previous page", onClick: () => setFilters(current => ({ ...current, page: Math.max(1, current.page - 1) })), children: _jsx(ChevronLeft, { size: 16, "aria-hidden": "true" }) }), _jsx("button", { type: "button", disabled: !requests.data || requests.data.current_page >= requests.data.last_page, "aria-label": "Next page", onClick: () => setFilters(current => ({ ...current, page: current.page + 1 })), children: _jsx(ChevronRight, { size: 16, "aria-hidden": "true" }) })] })] })] }), selected && _jsx(MidmileActionDialog, { selection: selected, busy: transition.isPending, error: transition.error?.message, onClose: () => setSelected(null), onSubmit: payload => transition.mutate({ ...selected, payload }) })] }) });
}
function MidmileActionDialog({ selection, busy, error, onClose, onSubmit }) {
    const confirming = selection.action === 'assign-truck';
    function submit(event) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onSubmit(confirming ? { plate_number: data.get('plate_number'), truck_size: data.get('truck_size'), truck_type: data.get('truck_type'), provide_time: data.get('provide_time') || null } : { rejection_remarks: data.get('rejection_remarks') });
    }
    return _jsxs(Modal, { open: true, onClose: onClose, className: "form-dialog compact", role: "dialog", ariaLabelledBy: "action-title", children: [_jsxs("div", { className: "dialog-head", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: selection.request.cluster }), _jsx("h2", { id: "action-title", children: confirming ? 'Assign truck' : 'Reject request' })] }), _jsx("button", { className: "icon-button", type: "button", title: "Close", "aria-label": "Close", onClick: onClose, children: _jsx(X, { size: 19 }) })] }), _jsxs("form", { onSubmit: submit, children: [confirming ? _jsxs(_Fragment, { children: [_jsxs("label", { children: ["Plate number", _jsx("input", { name: "plate_number", required: true, autoFocus: true, maxLength: 30 })] }), _jsxs("label", { children: ["Truck size", _jsxs("select", { name: "truck_size", defaultValue: selection.request.truck_size, children: [_jsx("option", { children: "4W" }), _jsx("option", { children: "6W" }), _jsx("option", { children: "10W" }), _jsx("option", { children: "6WF" })] })] }), _jsxs("label", { children: ["Truck type", _jsxs("select", { name: "truck_type", defaultValue: selection.request.truck_type, children: [_jsx("option", { children: "WETLEASE" }), _jsx("option", { children: "DRYLEASE" })] })] }), _jsxs("label", { children: ["Provide time", _jsx("input", { name: "provide_time", type: "datetime-local" })] })] }) : _jsxs("label", { children: ["Rejection remarks", _jsx("textarea", { name: "rejection_remarks", required: true, rows: 4, autoFocus: true })] }), error && _jsx("p", { className: "error notice", children: error }), _jsxs("div", { className: "dialog-actions", children: [_jsx("button", { className: "secondary-button", type: "button", onClick: onClose, children: "Cancel" }), _jsx("button", { disabled: busy, children: busy ? 'Saving...' : confirming ? _jsxs(_Fragment, { children: [_jsx(Truck, { size: 17 }), "Assign truck"] }) : 'Reject request' })] })] })] });
}
