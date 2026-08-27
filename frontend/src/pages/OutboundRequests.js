import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Ban, Check, Pencil, Plus, Save, X, XCircle } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { ColumnVisibilityMenu } from '../components/ColumnVisibilityMenu';
import { Modal } from '../components/Modal';
import { RequestFilters, statuses } from '../components/RequestFilters';
import { RequestTable } from '../components/RequestTable';
import { SkeletonTable } from '../components/SkeletonTable';
import { api } from '../lib/api';
import { defaultRequestFilters, exportRequestsCsv, requestMetricsQueryString, requestQueryString } from '../lib/requests';
import { useUiStore } from '../stores/ui';
const defaultColumns = ['status', 'request_timestamp', 'cluster', 'dock_no', 'backlogs', 'plate_number', 'truck_size', 'truck_type'];
const columnOptions = [
    { key: 'status', label: 'Status' },
    { key: 'request_timestamp', label: 'Request time' },
    { key: 'cluster', label: 'Cluster' },
    { key: 'dock_no', label: 'Dock #' },
    { key: 'backlogs', label: 'Backlogs' },
    { key: 'ob_fte', label: 'Ops FTE' },
    { key: 'linehaul_trip_no', label: 'LHTrip #' },
    { key: 'plate_number', label: 'Plate #' },
    { key: 'mm_fte', label: 'FTE MM' },
    { key: 'truck_size', label: 'Truck size' },
    { key: 'truck_type', label: 'Truck type' },
    { key: 'provide_time', label: 'Provide time' },
    { key: 'docked_time', label: 'Docked time' },
    { key: 'doc_officer', label: 'DOC officer' },
];
export function OutboundRequests({ user, queue }) {
    const queryClient = useQueryClient();
    const globalSearch = useUiStore(state => state.search);
    const setGlobalSearch = useUiStore(state => state.setSearch);
    const [filters, setFilters] = useState(() => ({ ...defaultRequestFilters, search: globalSearch }));
    const deferredSearch = useDeferredValue(filters.search);
    const [activeAction, setActiveAction] = useState(null);
    const [creating, setCreating] = useState(false);
    const [notice, setNotice] = useState('');
    const [exporting, setExporting] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
    const appliedFilters = { ...filters, search: deferredSearch };
    const requests = useQuery({
        queryKey: ['requests', 'outbound-all', appliedFilters],
        queryFn: () => api(`/requests?${requestQueryString(appliedFilters)}`),
        placeholderData: previous => previous,
    });
    const metrics = useQuery({
        queryKey: ['request-metrics', 'outbound-all', { search: appliedFilters.search, dateFrom: appliedFilters.dateFrom, dateTo: appliedFilters.dateTo }],
        queryFn: () => api(`/requests/metrics?${requestMetricsQueryString(appliedFilters)}`),
        placeholderData: previous => previous,
    });
    async function refreshData(message) {
        setNotice(message);
        await queryClient.invalidateQueries({ queryKey: ['requests'] });
        await queryClient.invalidateQueries({ queryKey: ['request-metrics'] });
        await queryClient.invalidateQueries({ queryKey: ['request-analytics'] });
    }
    const createRequest = useMutation({
        mutationFn: (payload) => api('/requests', { method: 'POST', body: JSON.stringify(payload) }),
        onSuccess: async () => { setCreating(false); await refreshData('LH request created.'); },
    });
    const editRequest = useMutation({
        mutationFn: async ({ request, payload }) => {
            await api(`/requests/${request.id}`, { method: 'PUT', body: JSON.stringify(payload) });
            return api(`/requests/${request.id}/approve`, { method: 'POST', body: '{}' });
        },
        onSuccess: async () => { setActiveAction(null); await refreshData('Request updated and routed to FTE MM.'); },
    });
    const transition = useMutation({
        mutationFn: ({ request, action }) => api(`/requests/${request.id}/${action}`, { method: 'POST', body: '{}' }),
        onSuccess: async (_, variables) => { setActiveAction(null); await refreshData(variables.action === 'approve' ? 'Request approved.' : variables.action === 'reject-ops' ? 'Request rejected.' : 'Request cancelled.'); },
    });
    const bulkApprove = useMutation({
        mutationFn: (ids) => api('/requests/bulk-approve', { method: 'POST', body: JSON.stringify({ ids }) }),
        onSuccess: async (_, ids) => {
            await refreshData(`Approved ${ids.length} request${ids.length === 1 ? '' : 's'}.`);
        },
    });
    const actionable = (request) => request.status === 'PENDING' || request.status === 'REJECTED_BY_MM';
    const actions = (request) => user.role === 'fte_ops' && actionable(request) ? _jsxs(_Fragment, { children: [_jsxs("button", { className: "table-action approve", type: "button", disabled: transition.isPending, onClick: () => transition.mutate({ request, action: 'approve' }), children: [_jsx(Check, { size: 15 }), "Approve"] }), _jsxs("button", { className: "table-action edit", type: "button", disabled: editRequest.isPending, onClick: () => setActiveAction({ kind: 'edit', request }), children: [_jsx(Pencil, { size: 15 }), "Edit"] }), _jsxs("button", { className: "table-action reject", type: "button", disabled: transition.isPending, onClick: () => setActiveAction({ kind: 'reject', request }), children: [_jsx(XCircle, { size: 15 }), "Reject"] })] }) : user.role === 'ops_pic' && actionable(request) ? _jsxs("button", { className: "table-action cancel", type: "button", disabled: transition.isPending, onClick: () => setActiveAction({ kind: 'reject', request }), children: [_jsx(Ban, { size: 15 }), "Cancel"] }) : null;
    function sortBy(sort) {
        setFilters(value => ({ ...value, sort, direction: value.sort === sort && value.direction === 'asc' ? 'desc' : 'asc', page: 1 }));
    }
    async function exportCsv() {
        setExporting(true);
        setNotice('');
        try {
            await exportRequestsCsv(appliedFilters, `lh-requests-${new Date().toISOString().slice(0, 10)}.csv`);
        }
        catch (error) {
            setNotice(error instanceof Error ? error.message : 'CSV export failed.');
        }
        finally {
            setExporting(false);
        }
    }
    const statusSummary = statuses.map(status => ({ value: status, count: status === 'ALL' ? (metrics.data?.total ?? 0) : (metrics.data?.by_status?.[status] ?? 0) }));
    const error = createRequest.error || editRequest.error || transition.error;
    const approvable = requests.data?.data?.filter(request => request.status === 'PENDING' || request.status === 'REJECTED_BY_MM').map(request => request.id) ?? [];
    return _jsxs("div", { className: "workspace-view", children: [(notice || error) && _jsx("p", { className: `notice${error || notice.includes('failed') ? ' error' : ' success-notice'}`, children: error?.message || notice }), _jsxs("section", { className: "request-list-section", children: [_jsxs("div", { className: "request-page-heading", children: [_jsxs("div", { children: [_jsxs("p", { className: "request-page-kicker", children: [_jsx(Activity, { size: 13 }), " Outbound workspace"] }), _jsx("h1", { children: "Linehaul requests" }), _jsx("p", { className: "request-page-description", children: "Keep every dock movement visible, actionable, and moving on time." })] }), _jsxs("div", { className: "request-page-meta", children: [_jsx("span", { className: "live-indicator" }), " Live queue ", _jsx("strong", { children: requests.data?.total ?? 0 })] })] }), _jsxs("div", { className: "request-snapshot", "aria-label": "Request snapshot", children: [_jsxs("div", { className: "snapshot-card snapshot-card--accent", children: [_jsx("span", { children: "All requests" }), _jsx("strong", { children: metrics.isPending ? '-' : metrics.data?.total ?? 0 }), _jsx("small", { children: "Across the selected range" })] }), _jsxs("div", { className: "snapshot-card", children: [_jsx("span", { children: "Awaiting action" }), _jsx("strong", { children: metrics.isPending ? '-' : metrics.data?.awaiting_action ?? 0 }), _jsx("small", { children: "Needs an ops decision" })] }), _jsxs("div", { className: "snapshot-card", children: [_jsx("span", { children: "Visible rows" }), _jsx("strong", { children: requests.isPending ? '-' : requests.data?.data.length ?? 0 }), _jsx("small", { children: "Current page results" })] })] }), _jsxs("div", { className: "page-actions", children: [user.role === 'ops_pic' && _jsxs("button", { type: "button", onClick: () => setCreating(true), children: [_jsx(Plus, { size: 17 }), "Create request"] }), user.role === 'fte_ops' && _jsx("button", { type: "button", className: "secondary-button", disabled: !approvable.length || bulkApprove.isPending, onClick: () => bulkApprove.mutate(approvable), children: bulkApprove.isPending ? 'Approving...' : `Approve ${approvable.length || ''} visible` })] }), _jsx("div", { className: "request-toolbar-surface", children: _jsx(ColumnVisibilityMenu, { visible: visibleColumns, onChange: setVisibleColumns, options: columnOptions }) }), _jsx(RequestFilters, { filters: filters, exporting: exporting, statusSummary: statusSummary, hideStatusFilter: user.role === 'fte_ops', onChange: next => { setFilters(next); setGlobalSearch(next.search); }, onExport: () => void exportCsv(), onRefresh: () => void requests.refetch() }), _jsxs("section", { className: "panel data-panel", children: [creating && _jsx(InlineCreateRow, { busy: createRequest.isPending, onCancel: () => setCreating(false), onSubmit: payload => { setNotice(''); createRequest.mutate(payload); } }), requests.isPending ? _jsxs("div", { className: "table-loading-shell", children: [_jsxs("div", { className: "table-loading-toolbar", children: [_jsx("span", { className: "skeleton-chip" }), _jsx("span", { className: "skeleton-chip" }), _jsx("span", { className: "skeleton-chip" })] }), _jsx(SkeletonTable, { columns: visibleColumns.length + 2, rows: 4 })] }) : requests.error ? _jsx("p", { className: "state error", children: requests.error.message }) : _jsxs(_Fragment, { children: [_jsx(RequestTable, { rows: requests.data?.data ?? [], actions: actions, sort: filters.sort, direction: filters.direction, onSort: sortBy, visibleColumns: visibleColumns, emptyAction: _jsxs(_Fragment, { children: [user.role === 'ops_pic' && _jsx("button", { type: "button", onClick: () => setCreating(true), children: "Create request" }), _jsx("button", { type: "button", className: "secondary-button", onClick: () => { setFilters(defaultRequestFilters); setGlobalSearch(''); }, children: "Clear filters" }), _jsx("button", { type: "button", className: "secondary-button", onClick: () => void requests.refetch(), children: "Refresh" })] }) }), _jsx(Pagination, { page: requests.data, onPageChange: page => setFilters(value => ({ ...value, page })) })] })] })] }), activeAction?.kind === 'edit' && _jsx(EditRequestDialog, { request: activeAction.request, busy: editRequest.isPending, error: editRequest.error?.message, onClose: () => setActiveAction(null), onSubmit: payload => editRequest.mutate({ request: activeAction.request, payload }) }), activeAction?.kind === 'reject' && _jsx(ConfirmRejectDialog, { request: activeAction.request, isCancel: user.role === 'ops_pic', busy: transition.isPending, onClose: () => setActiveAction(null), onConfirm: () => transition.mutate({ request: activeAction.request, action: user.role === 'fte_ops' ? 'reject-ops' : 'cancel' }) })] });
}
function requestPayload(form) {
    const data = new FormData(form);
    return { cluster: data.get('cluster'), region: data.get('region'), dock_no: data.get('dock_no'), backlogs: Number(data.get('backlogs')), backlogs_timestamp: data.get('backlogs_timestamp'), truck_size: data.get('truck_size'), truck_type: data.get('truck_type') };
}
function RequestFields({ request }) {
    return _jsxs("div", { className: "form-grid request-form-grid", children: [_jsxs("label", { children: ["Cluster", _jsx("input", { name: "cluster", required: true, maxLength: 120, defaultValue: request?.cluster })] }), _jsxs("label", { children: ["Region", _jsx("input", { name: "region", required: true, maxLength: 120, defaultValue: request?.region })] }), _jsxs("label", { children: ["Dock number", _jsx("input", { name: "dock_no", required: true, maxLength: 50, defaultValue: request?.dock_no })] }), _jsxs("label", { children: ["Backlogs", _jsx("input", { name: "backlogs", type: "number", required: true, min: 0, defaultValue: request?.backlogs ?? 0 })] }), _jsxs("label", { children: ["Truck size", _jsxs("select", { name: "truck_size", defaultValue: request?.truck_size ?? '6W', children: [_jsx("option", { children: "4W" }), _jsx("option", { children: "6W" }), _jsx("option", { children: "10W" }), _jsx("option", { children: "6WF" })] })] }), _jsxs("label", { children: ["Truck type", _jsxs("select", { name: "truck_type", defaultValue: request?.truck_type ?? 'WETLEASE', children: [_jsx("option", { children: "WETLEASE" }), _jsx("option", { children: "DRYLEASE" })] })] })] });
}
function InlineCreateRow({ busy, onCancel, onSubmit }) {
    const [clusterText, setClusterText] = useState('');
    const [selected, setSelected] = useState(null);
    const clusterSearch = useDeferredValue(clusterText);
    const lookup = useQuery({
        queryKey: ['clusters', clusterSearch],
        queryFn: () => api(`/clusters?search=${encodeURIComponent(clusterSearch)}`),
        enabled: clusterSearch.trim().length >= 3,
    });
    function pick(cluster) {
        setSelected(cluster);
        setClusterText(cluster.cluster_name);
    }
    function submit(event) {
        event.preventDefault();
        onSubmit(requestPayload(event.currentTarget));
    }
    return _jsxs("form", { className: "inline-create-row", onSubmit: submit, children: [_jsxs("label", { className: "cluster-lookup-field", children: ["Cluster", _jsx("input", { name: "cluster", required: true, autoFocus: true, maxLength: 120, value: clusterText, onChange: event => { setClusterText(event.target.value); setSelected(null); }, placeholder: "Type 3 chars" }), lookup.data && !selected && _jsx("div", { className: "cluster-suggestions", children: lookup.data.data.length ? lookup.data.data.map(cluster => _jsxs("button", { type: "button", onClick: () => pick(cluster), children: [_jsx("strong", { children: cluster.cluster_name }), _jsxs("span", { children: [cluster.hub_name, " / ", cluster.region] })] }, cluster.id)) : _jsx("p", { children: "No cluster found." }) })] }), _jsxs("label", { children: ["Region", _jsx("input", { name: "region", required: true, readOnly: true, value: selected?.region ?? '' })] }), _jsxs("label", { children: ["Dock No", _jsx("input", { name: "dock_no", required: true, maxLength: 50, defaultValue: selected?.dock_number ?? '' }, selected?.id ?? 'dock')] }), _jsxs("label", { children: ["Backlogs", _jsx("input", { name: "backlogs", type: "number", required: true, readOnly: true, min: 0, value: selected?.backlogs ?? 0 })] }), _jsxs("label", { children: ["Backlogs Timestamp", _jsx("input", { readOnly: true, value: selected?.backlogs_ts ? new Date(selected.backlogs_ts).toLocaleString() : '' }), _jsx("input", { type: "hidden", name: "backlogs_timestamp", value: selected?.backlogs_ts ?? '' })] }), _jsxs("label", { children: ["Truck Size", _jsxs("select", { name: "truck_size", defaultValue: "6W", children: [_jsx("option", { children: "4W" }), _jsx("option", { children: "6W" }), _jsx("option", { children: "10W" }), _jsx("option", { children: "6WF" })] })] }), _jsxs("label", { children: ["Truck Type", _jsxs("select", { name: "truck_type", defaultValue: "WETLEASE", children: [_jsx("option", { children: "WETLEASE" }), _jsx("option", { children: "DRYLEASE" })] })] }), _jsxs("div", { className: "inline-create-actions", children: [_jsxs("button", { className: "secondary-button", type: "button", onClick: onCancel, children: [_jsx(X, { size: 15 }), "Cancel"] }), _jsxs("button", { disabled: busy || !selected, children: [_jsx(Save, { size: 15 }), busy ? 'Saving...' : 'Save'] })] })] });
}
function EditRequestDialog({ request, busy, error, onClose, onSubmit }) {
    function submit(event) { event.preventDefault(); onSubmit(requestPayload(event.currentTarget)); }
    return _jsxs(Modal, { open: true, onClose: onClose, ariaLabelledBy: "edit-title", children: [_jsxs("div", { className: "dialog-head", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "FTE OPS" }), _jsx("h2", { id: "edit-title", children: "Edit LH request" })] }), _jsx("button", { className: "icon-button", type: "button", title: "Close", "aria-label": "Close", onClick: onClose, children: _jsx(X, { size: 19 }) })] }), _jsxs("form", { onSubmit: submit, children: [_jsx(RequestFields, { request: request }), error && _jsx("p", { className: "error notice", children: error }), _jsxs("div", { className: "dialog-actions", children: [_jsx("button", { className: "secondary-button", type: "button", onClick: onClose, children: "Cancel" }), _jsx("button", { disabled: busy, children: busy ? 'Saving...' : 'Save changes' })] })] })] });
}
function ConfirmRejectDialog({ request, isCancel, busy, onClose, onConfirm }) {
    return _jsxs(Modal, { open: true, onClose: onClose, className: "form-dialog compact", role: "alertdialog", ariaLabelledBy: "reject-title", children: [_jsxs("div", { className: "dialog-head", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: request.cluster }), _jsx("h2", { id: "reject-title", children: isCancel ? 'Cancel request' : 'Reject request' })] }), _jsx("button", { className: "icon-button", type: "button", title: "Close", "aria-label": "Close", onClick: onClose, children: _jsx(X, { size: 19 }) })] }), _jsx("p", { className: "dialog-copy", children: "This request will be moved to Cancelled and removed from the active queue." }), _jsxs("div", { className: "dialog-actions", children: [_jsx("button", { className: "secondary-button", type: "button", onClick: onClose, children: "Keep request" }), _jsx("button", { className: "danger-button", type: "button", disabled: busy, onClick: onConfirm, children: busy ? 'Saving...' : isCancel ? 'Cancel request' : 'Reject request' })] })] });
}
