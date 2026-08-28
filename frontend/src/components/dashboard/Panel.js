import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Panel({ kicker, title, description, action, className = '', children }) {
    return _jsxs("article", { className: `panel${className ? ` ${className}` : ''}`, children: [_jsxs("div", { className: "panel-head", children: [_jsxs("div", { children: [_jsx("p", { className: "panel-kicker", children: kicker }), _jsx("h2", { children: title }), _jsx("p", { children: description })] }), action] }), _jsx("div", { className: "panel-body", children: children })] });
}
