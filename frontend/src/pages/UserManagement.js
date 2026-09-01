import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, UserX, X } from 'lucide-react';
import { Modal } from '../components/Modal';
import { api } from '../lib/api';
import { Skiper87 } from '../components/ui/skiper-ui/skiper87';
const roles = ['ops_pic', 'fte_ops', 'fte_mm', 'doc_officer', 'dock_officer'];
export function UserManagement() {
    const client = useQueryClient();
    const [creating, setCreating] = useState(false);
    const users = useQuery({ queryKey: ['users'], queryFn: () => api('/users') });
    const create = useMutation({ mutationFn: (body) => api('/users', { method: 'POST', body: JSON.stringify(body) }), onSuccess: async () => { setCreating(false); await client.invalidateQueries({ queryKey: ['users'] }); } });
    const update = useMutation({ mutationFn: ({ id, body }) => api(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }), onSuccess: () => client.invalidateQueries({ queryKey: ['users'] }) });
    const disable = useMutation({ mutationFn: (id) => api(`/users/${id}/disable`, { method: 'PATCH' }), onSuccess: () => client.invalidateQueries({ queryKey: ['users'] }) });
    return _jsxs("div", { className: "workspace-view", children: [_jsx("div", { className: "page-actions", children: _jsxs("button", { onClick: () => setCreating(true), children: [_jsx(Plus, { size: 17 }), "Add Ops PIC"] }) }), (update.error || disable.error) && _jsx("p", { className: "notice error", children: (update.error || disable.error)?.message }), _jsx("section", { className: "panel data-panel", children: _jsx("div", { className: "table-wrap request-table-wrap", children: _jsx(Skiper87, { className: "request-table-scroll", children: _jsxs("table", { className: "request-table", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "User" }), _jsx("th", { children: "Identifier" }), _jsx("th", { children: "Role" }), _jsx("th", { children: "Status" }), _jsx("th", { children: "Actions" })] }) }), _jsx("tbody", { children: (users.data?.data ?? []).map(user => _jsxs("tr", { children: [_jsx("td", { children: user.name }), _jsx("td", { children: user.email || user.ops_id || '-' }), _jsx("td", { children: _jsx("select", { value: user.role, onChange: event => update.mutate({ id: user.id, body: { name: user.name, role: event.target.value } }), children: roles.map(role => _jsx("option", { children: role }, role)) }) }), _jsx("td", { children: user.is_active ? 'Active' : 'Disabled' }), _jsx("td", { children: user.is_active && _jsxs("button", { className: "table-action reject", onClick: () => disable.mutate(user.id), children: [_jsx(UserX, { size: 15 }), "Disable"] }) })] }, user.id)) })] }) }) }) }), creating && _jsx(CreateUser, { busy: create.isPending, error: create.error?.message, onClose: () => setCreating(false), onSubmit: body => create.mutate(body) })] });
}
function CreateUser({ busy, error, onClose, onSubmit }) {
    function submit(event) { event.preventDefault(); const data = new FormData(event.currentTarget); onSubmit({ name: data.get('name'), ops_id: data.get('ops_id') }); }
    return _jsxs(Modal, { open: true, onClose: onClose, className: "form-dialog compact", ariaLabel: "Add Ops PIC", children: [_jsxs("div", { className: "dialog-head", children: [_jsx("h2", { children: "Add Ops PIC" }), _jsx("button", { className: "icon-button", type: "button", "aria-label": "Close", onClick: onClose, children: _jsx(X, {}) })] }), _jsxs("form", { onSubmit: submit, children: [_jsxs("label", { children: ["Name", _jsx("input", { name: "name", required: true })] }), _jsxs("label", { children: ["OPS ID", _jsx("input", { name: "ops_id", required: true, pattern: "ops[0-9]+", placeholder: "ops12345" })] }), error && _jsx("p", { className: "notice error", children: error }), _jsxs("div", { className: "dialog-actions", children: [_jsx("button", { type: "button", className: "secondary-button", onClick: onClose, children: "Cancel" }), _jsx("button", { disabled: busy, children: busy ? 'Creating...' : 'Create user' })] })] })] });
}
