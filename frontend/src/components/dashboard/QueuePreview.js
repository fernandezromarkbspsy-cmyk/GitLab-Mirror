import { jsx as _jsx } from "react/jsx-runtime";
export function QueuePreview({ items, emptyMessage, renderItem, className = '' }) {
    return _jsx("div", { className: `dashboard-list${className ? ` ${className}` : ''}`, children: items.length ? items.map(renderItem) : _jsx("p", { className: "compact-empty", children: emptyMessage }) });
}
