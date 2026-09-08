import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CalendarDays, Download, RefreshCw, Search } from 'lucide-react';
export const statuses = ['ALL', 'PENDING', 'APPROVED', 'REJECTED_BY_MM', 'ASSIGNED', 'FOR_DOCKING', 'DOCKED', 'CONFIRMED', 'CANCELLED'];
export function RequestFilters({ filters, exporting, statusSummary = [], hideStatusFilter = false, onChange, onExport, onRefresh }) {
    function change(values) {
        onChange({ ...filters, ...values, page: 1 });
    }
    const tabs = statusSummary.length ? statusSummary : statuses.map(value => ({ value, count: 0 }));
    const today = new Date().toISOString().slice(0, 10);
    const selectedDate = filters.dateFrom || today;
    return _jsxs("section", { className: "request-controls", "aria-label": "Request filters", children: [_jsx("div", { className: "request-status-tabs", role: "tablist", "aria-label": "Request status tabs", children: tabs.map(tab => {
                    const active = filters.status === tab.value;
                    return _jsxs("button", { className: `status-tab ${active ? 'active' : ''}`, type: "button", onClick: () => change({ status: tab.value }), children: [_jsx("span", { children: tab.value === 'ALL' ? 'All' : tab.value.replaceAll('_', ' ') }), _jsx("span", { className: "status-tab-badge", children: tab.count })] }, tab.value);
                }) }), _jsxs("div", { className: "request-toolbar", children: [_jsxs("label", { className: "search-field", children: [_jsx(Search, { size: 16 }), _jsx("input", { "aria-label": "Search requests", placeholder: "Search", value: filters.search, onChange: event => change({ search: event.target.value }) })] }), _jsxs("label", { className: "filter-field date-field", children: [_jsx(CalendarDays, { size: 16 }), _jsx("input", { type: "date", value: selectedDate, onChange: event => change({ dateFrom: event.target.value, dateTo: event.target.value }) })] }), !hideStatusFilter && _jsxs("label", { className: "filter-field status-filter", children: [_jsx("span", { children: "Status" }), _jsx("select", { value: filters.status, onChange: event => change({ status: event.target.value }), children: statuses.map(value => _jsx("option", { value: value, children: value.replaceAll('_', ' ') }, value)) })] }), _jsxs("div", { className: "control-actions", children: [_jsx("button", { className: "toolbar-button icon-button", type: "button", title: "Refresh requests", "aria-label": "Refresh requests", onClick: onRefresh, children: _jsx(RefreshCw, { size: 16 }) }), _jsxs("button", { className: "toolbar-button export-button", type: "button", disabled: exporting, onClick: onExport, children: [_jsx(Download, { size: 16 }), exporting ? 'Exporting' : 'CSV'] })] })] })] });
}
