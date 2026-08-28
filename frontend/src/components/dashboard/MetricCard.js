import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowUpRight } from 'lucide-react';
export function MetricCard({ label, value, icon, chip, footnote, primary = false, onClick }) {
    return _jsxs("button", { type: "button", className: `metric-card${primary ? ' metric-card--primary' : ''}`, onClick: onClick, children: [_jsxs("span", { className: "metric-card-top", children: [_jsx("span", { className: "metric-icon", children: icon }), _jsx("span", { className: "metric-chip", children: chip })] }), _jsxs("span", { className: "metric-copy", children: [_jsx("small", { children: label }), _jsx("strong", { children: value })] }), _jsxs("span", { className: "metric-foot", children: [_jsx("span", { children: footnote }), _jsx(ArrowUpRight, { size: 16 })] })] });
}
