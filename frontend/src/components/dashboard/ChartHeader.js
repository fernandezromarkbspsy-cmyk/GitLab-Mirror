import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ChartHeader({ kicker, title, description, controls }) {
    return _jsxs("div", { className: "balance-head", children: [_jsxs("div", { children: [_jsx("p", { className: "panel-kicker", children: kicker }), _jsx("h2", { children: title }), _jsx("p", { children: description })] }), controls] });
}
