import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
function getFocusable(container) {
    return Array.from(container.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter(element => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'));
}
export function Modal({ open, onClose, children, className = 'form-dialog', ariaLabelledBy, ariaLabel, role = 'dialog' }) {
    const panelRef = useRef(null);
    const lastActiveRef = useRef(null);
    useEffect(() => {
        if (!open)
            return;
        lastActiveRef.current = document.activeElement;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const focusPanel = window.setTimeout(() => {
            const panel = panelRef.current;
            if (!panel)
                return;
            const focusable = getFocusable(panel);
            (focusable[0] ?? panel).focus();
        }, 0);
        function onKeyDown(event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }
            if (event.key !== 'Tab')
                return;
            const panel = panelRef.current;
            if (!panel)
                return;
            const focusable = getFocusable(panel);
            if (!focusable.length) {
                event.preventDefault();
                panel.focus();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;
            if (event.shiftKey && active === first) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
        }
        document.addEventListener('keydown', onKeyDown);
        return () => {
            window.clearTimeout(focusPanel);
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = prevOverflow;
            lastActiveRef.current?.focus?.();
        };
    }, [onClose, open]);
    if (!open)
        return null;
    return _jsx("div", { className: "dialog-layer", role: "presentation", onMouseDown: event => event.target === event.currentTarget && onClose(), children: _jsx("section", { ref: panelRef, className: className, role: role, "aria-modal": "true", "aria-labelledby": ariaLabelledBy, "aria-label": ariaLabel, tabIndex: -1, children: children }) });
}
