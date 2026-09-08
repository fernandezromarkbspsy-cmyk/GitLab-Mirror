import { jsx as _jsx } from "react/jsx-runtime";
const statusLabelMap = {
    APPROVED: 'Approved',
    ASSIGNED: 'Assigned',
    CANCELLED: 'Cancelled',
    CONFIRMED: 'Confirmed',
    DOCKED: 'Docked',
    FOR_DOCKING: 'For docking',
    PENDING: 'Pending',
    REJECTED_BY_MM: 'Rejected',
};
export function StatusBadge({ status }) {
    return _jsx("span", { className: `status status--${status.toLowerCase()}`, children: statusLabelMap[status] ?? status.replaceAll('_', ' ') });
}
