import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
export function ColumnVisibilityMenu({ label = 'Columns', options, visible, onChange }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    useEffect(() => {
        function handlePointerDown(event) {
            const target = event.target;
            if (rootRef.current && !rootRef.current.contains(target))
                setOpen(false);
        }
        function handleEscape(event) {
            if (event.key === 'Escape')
                setOpen(false);
        }
        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);
    function toggle(key) {
        const next = visible.includes(key) ? visible.filter(value => value !== key) : [...visible, key];
        onChange(next.length ? next : visible);
    }
    return _jsxs("div", { ref: rootRef, className: "column-visibility", children: [_jsxs("button", { className: "toolbar-button column-visibility-button", type: "button", "aria-expanded": open, onClick: () => setOpen(value => !value), children: [label, _jsx(ChevronDown, { size: 15 })] }), open && _jsx("div", { className: "column-visibility-menu", role: "menu", "aria-label": `${label} menu`, children: options.map(option => _jsxs("label", { className: "column-visibility-option", children: [_jsx("input", { type: "checkbox", checked: visible.includes(option.key), onChange: () => toggle(option.key) }), _jsx("span", { children: option.label })] }, option.key)) })] });
}
