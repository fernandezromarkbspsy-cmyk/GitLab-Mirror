import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Printer, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Modal } from './Modal';
const templateSrc = {
    single: '/printable_templates/single_lh.jpg',
    coload: '/printable_templates/coload_lh.jpg',
    triload: '/printable_templates/triload_lh.jpg',
};
function clusters(request) {
    return request.cluster.split(',').map(value => value.trim()).filter(Boolean);
}
function templateKind(count) {
    if (count <= 1)
        return 'single';
    if (count === 2)
        return 'coload';
    return 'triload';
}
function dockTime(request) {
    if (!request.docked_time)
        return '';
    const date = new Date(request.docked_time);
    return Number.isNaN(date.getTime()) ? request.docked_time : date.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function qrCells(value) {
    const size = 21;
    let seed = 0;
    for (let index = 0; index < value.length; index += 1)
        seed = (seed * 31 + value.charCodeAt(index)) >>> 0;
    const cells = [];
    for (let row = 0; row < size; row += 1) {
        for (let column = 0; column < size; column += 1) {
            const finder = (row < 7 && column < 7) || (row < 7 && column > 13) || (row > 13 && column < 7);
            const finderInner = finder && (row % 6 === 0 || column % 6 === 0 || (row % 6 >= 2 && row % 6 <= 4 && column % 6 >= 2 && column % 6 <= 4));
            seed = (seed * 1664525 + 1013904223) >>> 0;
            cells.push(finder ? finderInner : ((seed + row * 17 + column * 29) % 5) < 2);
        }
    }
    return cells;
}
function DriverQr({ value }) {
    const cells = qrCells(value || 'DRIVER');
    return _jsx("div", { className: "driver-qr", "aria-label": `Driver ID QR ${value}`, children: cells.map((active, index) => _jsx("i", { className: active ? 'on' : '' }, index)) });
}
function loadSlots(kind, values) {
    if (kind === 'single')
        return [{ className: 'load-single', value: values[0] ?? '' }];
    if (kind === 'coload')
        return [
            { className: 'load-left', value: values[1] ?? '' },
            { className: 'load-right', value: values[0] ?? '' },
        ];
    return [
        { className: 'load-third', value: values[2] ?? '' },
        { className: 'load-second', value: values[1] ?? '' },
        { className: 'load-first', value: values[0] ?? '' },
    ];
}
export function PrintableTruckLabel({ request, onClose }) {
    const clusterValues = clusters(request);
    const kind = templateKind(clusterValues.length);
    return createPortal(_jsxs(Modal, { open: true, onClose: onClose, className: "print-dialog", ariaLabel: "Printable truck label", children: [_jsxs("div", { className: "print-toolbar", children: [_jsx("strong", { children: "Printable LH label" }), _jsxs("div", { children: [_jsxs("button", { className: "secondary-button", type: "button", onClick: () => window.print(), children: [_jsx(Printer, { size: 16 }), "Print"] }), _jsx("button", { className: "icon-button", type: "button", "aria-label": "Close", onClick: onClose, children: _jsx(X, { size: 18 }) })] })] }), _jsx("div", { className: "print-preview", children: _jsxs("div", { className: `truck-label truck-label--${kind}`, children: [_jsx("img", { src: templateSrc[kind], alt: "" }), _jsx("div", { className: "label-value plate", children: request.plate_number || '' }), _jsxs("div", { className: "label-value driver", children: [_jsx(DriverQr, { value: request.driver_id || '' }), _jsx("span", { children: request.driver_id || '' })] }), _jsx("div", { className: "label-value dock", children: request.dock_no }), _jsx("div", { className: "label-value dock-time", children: dockTime(request) }), loadSlots(kind, clusterValues).map(slot => _jsx("div", { className: `label-value ${slot.className}`, children: slot.value }, slot.className))] }) })] }), document.body);
}
