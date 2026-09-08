import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronLeft, ChevronRight } from 'lucide-react';
export function Pagination({ page, onPageChange }) {
    if (page.last_page <= 1)
        return null;
    return _jsxs("nav", { className: "pagination", "aria-label": "Table pagination", children: [_jsxs("p", { children: [page.from ?? 0, "-", page.to ?? 0, " of ", page.total] }), _jsxs("div", { children: [_jsx("button", { className: "icon-button", type: "button", title: "Previous page", "aria-label": "Previous page", disabled: page.current_page <= 1, onClick: () => onPageChange(page.current_page - 1), children: _jsx(ChevronLeft, { size: 18 }) }), _jsxs("span", { children: ["Page ", page.current_page, " of ", page.last_page] }), _jsx("button", { className: "icon-button", type: "button", title: "Next page", "aria-label": "Next page", disabled: page.current_page >= page.last_page, onClick: () => onPageChange(page.current_page + 1), children: _jsx(ChevronRight, { size: 18 }) })] })] });
}
