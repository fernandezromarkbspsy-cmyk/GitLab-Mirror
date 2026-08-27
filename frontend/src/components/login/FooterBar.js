import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Lock, ShieldCheck } from 'lucide-react';
import { Reveal } from './Reveal';
function Icon24() {
    return (_jsxs("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", className: "h-[17px] w-[17px]", "aria-hidden": true, children: [_jsx("path", { d: "M20.5 12a8.5 8.5 0 1 1-2.55-6.05" }), _jsx("path", { d: "M20.5 3.6v3.6h-3.6" }), _jsx("text", { x: "12", y: "15.6", textAnchor: "middle", fontSize: "8.6", fontWeight: "700", fill: "currentColor", stroke: "none", children: "24" })] }));
}
const ITEMS = [
    {
        icon: _jsx(ShieldCheck, { className: "h-[17px] w-[17px]", strokeWidth: 2 }),
        title: 'Secure & Protected',
        sub: 'Your data is safe',
    },
    {
        icon: _jsx(Lock, { className: "h-4 w-4", strokeWidth: 2 }),
        title: 'Authorized Access Only',
        sub: 'For operations personnel',
    },
    {
        icon: _jsx(Icon24, {}),
        title: '24/7 Operations',
        sub: 'AI Chart Support',
    },
];
export function FooterBar() {
    return (_jsx("footer", { className: "grid grid-cols-1 divide-y divide-line border-t border-line bg-white/[0.04] sm:grid-cols-3 sm:divide-x sm:divide-y-0", children: ITEMS.map((item, i) => (_jsx(Reveal, { delay: i * 100, children: _jsxs("div", { className: "group flex h-full items-center gap-3 px-5 py-4 transition-colors duration-300 hover:bg-white/[0.05] sm:justify-center", children: [_jsx("span", { className: "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/15 text-link ring-1 ring-accent/30 transition-all duration-300 group-hover:scale-105 group-hover:bg-accent/25 group-hover:ring-accent/55", children: item.icon }), _jsxs("div", { children: [_jsx("p", { className: "font-display text-[12.5px] font-semibold text-ink", children: item.title }), _jsx("p", { className: "mt-0.5 text-[11.5px] text-faint", children: item.sub })] })] }) }, item.title))) }));
}
