import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Users, Warehouse } from 'lucide-react';
const OPTIONS = [
    { key: 'fte', label: 'FTE', icon: Users },
    { key: 'backroom', label: 'Backroom', icon: Warehouse },
];
export function UserTypeToggle({ value, onChange }) {
    const index = OPTIONS.findIndex((o) => o.key === value);
    return (_jsxs("div", { role: "tablist", "aria-label": "Login as", className: "relative grid grid-cols-2 gap-1 rounded-xl border border-line bg-white/[0.06] p-1 backdrop-blur-sm", children: [_jsx("span", { "aria-hidden": true, className: "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-gradient-to-r from-accent to-accent-2 shadow-md shadow-accent/30 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]", style: { transform: `translateX(${index * 100}%)` } }), OPTIONS.map((o) => {
                const active = o.key === value;
                const Icon = o.icon;
                return (_jsxs("button", { type: "button", role: "tab", "aria-selected": active, onClick: () => onChange(o.key), className: `relative z-10 flex h-9 items-center justify-center gap-1.5 rounded-lg font-display text-[13px] font-semibold transition-colors duration-200 ${active ? 'text-white' : 'text-faint hover:text-ink'}`, children: [_jsx(Icon, { className: "h-4 w-4", strokeWidth: 2.1 }), o.label] }, o.key));
            })] }));
}
