import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SkeletonTable({ columns, rows = 5, compact = false }) {
    const columnCount = Math.max(1, columns);
    const rowCount = Math.max(1, rows);
    return _jsxs("div", { className: `skeleton-table${compact ? ' compact' : ''}`, "aria-hidden": "true", style: { ['--skeleton-cols']: columnCount }, children: [_jsx("div", { className: "skeleton-table-head", children: Array.from({ length: columnCount }).map((_, index) => _jsx("span", { className: "skeleton-line skeleton-line--head" }, index)) }), _jsx("div", { className: "skeleton-table-body", children: Array.from({ length: rowCount }).map((_, rowIndex) => _jsx("div", { className: "skeleton-table-row", children: Array.from({ length: columnCount }).map((__, columnIndex) => _jsx("span", { className: `skeleton-line${columnIndex === 0 ? ' skeleton-line--pill' : ''}${columnIndex === columnCount - 1 ? ' skeleton-line--short' : ''}` }, columnIndex)) }, rowIndex)) })] });
}
