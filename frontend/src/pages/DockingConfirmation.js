import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ShipWheel, X } from 'lucide-react';
import { Modal } from '../components/Modal';
import { api } from '../lib/api';
import { PrintableTruckLabel } from '../components/PrintableTruckLabel';
import { RequestTable } from '../components/RequestTable';
import { SkeletonTable } from '../components/SkeletonTable';
export function DockingConfirmation({ user }) {
    const client = useQueryClient();
    const [selected, setSelected] = useState(null);
    const [printable, setPrintable] = useState(null);
    const queue = useQuery({
        queryKey: ['requests', 'docking'],
        queryFn: () => api('/requests?per_page=100&sort=created_at&direction=desc'),
        enabled: user.role === 'doc_officer' || user.role === 'dock_officer',
    });
    const action = useMutation({
        mutationFn: ({ request, action, payload }) => api(`/requests/${request.id}/${action}`, { method: 'POST', body: JSON.stringify(payload ?? {}) }),
        onSuccess: async (updated, variables) => {
            setSelected(null);
            if (variables.action === 'mark-docked')
                setPrintable(updated);
            await client.invalidateQueries({ queryKey: ['requests'] });
        },
    });
    const rows = (queue.data?.data ?? []).filter(request => request.status === 'FOR_DOCKING' || request.status === 'ASSIGNED' || request.status === 'DOCKED');
    const actions = (request) => request.status === 'DOCKED'
        ? _jsxs("button", { className: "table-action approve", onClick: () => action.mutate({ request, action: 'confirm' }), children: [_jsx(CheckCircle2, { size: 15 }), "Confirm"] })
        : _jsxs("button", { className: "table-action assign", onClick: () => setSelected(request), children: [_jsx(ShipWheel, { size: 15 }), "Dock truck"] });
    return _jsxs("div", { className: "workspace-view", children: [action.error && _jsx("p", { className: "notice error", children: action.error.message }), _jsxs("section", { className: "panel data-panel", children: [_jsx("div", { className: "panel-head", children: _jsxs("div", { children: [_jsx("h2", { children: "Docking queue" }), _jsx("p", { children: "Assigned trucks requiring dock action or final confirmation" })] }) }), queue.isPending ? _jsxs("div", { className: "table-loading-shell", children: [_jsxs("div", { className: "table-loading-toolbar", children: [_jsx("span", { className: "skeleton-chip" }), _jsx("span", { className: "skeleton-chip" })] }), _jsx(SkeletonTable, { columns: 4, rows: 4, compact: true })] }) : _jsx(RequestTable, { rows: rows, actions: actions, emptyMessage: "No trucks are waiting for docking." })] }), selected && _jsx(DockDialog, { request: selected, busy: action.isPending, onClose: () => setSelected(null), onSubmit: payload => action.mutate({ request: selected, action: 'mark-docked', payload }) }), printable && _jsx(PrintableTruckLabel, { request: printable, onClose: () => setPrintable(null) })] });
}
function datetimeLocal(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime()))
        return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function DockDialog({ request, busy, onClose, onSubmit }) {
    function submit(event) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        onSubmit({ driver_id: data.get('driver_id'), linehaul_trip_no: data.get('linehaul_trip_no'), docked_time: data.get('docked_time') });
    }
    return _jsxs(Modal, { open: true, onClose: onClose, className: "form-dialog compact", role: "dialog", ariaLabel: `Dock truck for ${request.cluster}`, children: [_jsxs("div", { className: "dialog-head", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: request.cluster }), _jsx("h2", { children: "Dock truck" })] }), _jsx("button", { className: "icon-button", type: "button", "aria-label": "Close", onClick: onClose, children: _jsx(X, { size: 18 }) })] }), _jsxs("form", { onSubmit: submit, children: [_jsxs("label", { children: ["Driver ID", _jsx("input", { name: "driver_id", required: true, autoFocus: true, defaultValue: request.driver_id ?? '' })] }), _jsxs("label", { children: ["LH Trip Number", _jsx("input", { name: "linehaul_trip_no", required: true, defaultValue: request.linehaul_trip_no ?? '' })] }), _jsxs("label", { children: ["Docked Time", _jsx("input", { name: "docked_time", type: "datetime-local", required: true, defaultValue: datetimeLocal(request.docked_time) })] }), _jsxs("div", { className: "dialog-actions", children: [_jsx("button", { type: "button", className: "secondary-button", onClick: onClose, children: "Cancel" }), _jsx("button", { disabled: busy, children: busy ? 'Saving...' : 'Mark as docked' })] })] })] });
}
