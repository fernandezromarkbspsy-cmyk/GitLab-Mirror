import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
export function OtpVerify({ destination, resendAfter, onBack, onDone, onResend, backLabel = 'Change email', }) {
    const [otp, setOtp] = useState(Array(6).fill(''));
    const refs = useRef([]);
    useEffect(() => {
        const id = window.setTimeout(() => refs.current[0]?.focus(), 60);
        return () => window.clearTimeout(id);
    }, []);
    const complete = otp.every((d) => d !== '');
    const set = (i, value) => {
        const d = value.replace(/\D/g, '').slice(-1);
        setOtp((p) => {
            const n = [...p];
            n[i] = d;
            return n;
        });
        if (d && i < 5)
            refs.current[i + 1]?.focus();
    };
    const key = (i, e) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0)
            refs.current[i - 1]?.focus();
    };
    const paste = (e) => {
        const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!t)
            return;
        e.preventDefault();
        const arr = Array(6).fill('');
        t.split('').forEach((c, i) => (arr[i] = c));
        setOtp(arr);
        refs.current[Math.min(t.length, 5)]?.focus();
    };
    const handleSubmit = (event) => {
        if (complete) {
            onDone(event, otp.join(''));
        }
    };
    return (_jsxs("form", { noValidate: true, className: "rise w-full", onSubmit: (event) => {
            event.preventDefault();
            handleSubmit(event);
        }, children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("span", { className: "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent/15 ring-1 ring-accent/40", children: _jsx(Check, { className: "h-4 w-4 text-link", strokeWidth: 2.6 }) }), _jsx("h2", { className: "font-display text-[17px] font-semibold text-ink", children: "Verify OTP" })] }), _jsxs("p", { className: "mt-2 truncate text-[12.5px] text-muted", children: ["Code sent to ", _jsx("span", { className: "font-semibold text-ink", children: destination })] }), _jsx("div", { className: "mt-4 flex gap-1.5", children: otp.map((d, i) => (_jsx("input", { ref: (el) => {
                        refs.current[i] = el;
                    }, value: d, onChange: (e) => set(i, e.target.value), onKeyDown: (e) => key(i, e), onPaste: i === 0 ? paste : undefined, inputMode: "numeric", pattern: "[0-9]", required: true, maxLength: 1, "aria-label": `Digit ${i + 1}`, className: "h-10 w-full min-w-0 rounded-lg border border-line bg-white/[0.07] text-center font-display text-[15px] font-semibold text-ink outline-none transition-all duration-200 focus:border-accent focus:bg-white/[0.12] focus:ring-4 focus:ring-accent/20" }, i))) }), _jsxs("button", { type: "submit", disabled: !complete, className: `btn-shine group mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-2 font-display text-[14px] font-semibold text-white shadow-lg shadow-accent/30 transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none disabled:hover:translate-y-0 ${complete ? 'ready-pulse' : ''}`, children: ["Verify & Continue", _jsx(ArrowRight, { className: "h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" })] }), _jsxs("div", { className: "mt-3 text-center text-[12px] text-muted", children: [resendAfter > 0 ? (_jsxs(_Fragment, { children: ["Resend in", ' ', _jsxs("span", { className: "font-semibold tabular-nums text-ink", children: [Math.floor(resendAfter / 60), ":", String(resendAfter % 60).padStart(2, '0')] })] })) : (_jsx("button", { type: "button", onClick: () => {
                            onResend();
                        }, className: "font-semibold text-link underline-offset-4 transition hover:underline", children: "Resend code" })), _jsx("span", { className: "mx-2 text-white/25", children: "|" }), _jsx("button", { type: "button", onClick: onBack, className: "text-faint underline-offset-4 transition hover:text-muted hover:underline", children: backLabel })] })] }));
}
