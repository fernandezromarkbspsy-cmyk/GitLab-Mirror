import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { isAuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { LoginCard } from '../components/login/LoginCard';
import { UserTypeToggle } from '../components/login/UserTypeToggle';
import { FteLoginForm } from '../components/login/FteLoginForm';
import { BackroomLoginForm } from '../components/login/BackroomLoginForm';
const backroomEmail = (opsId) => `${opsId.trim().toLowerCase()}@backroom.soc5.internal`;
const authErrorMessages = {
    email_address_not_authorized: 'Email delivery is not configured for this address. Ask an administrator to enable custom SMTP in Supabase.',
    email_provider_disabled: 'Email sign-in is disabled in Supabase Authentication settings.',
    otp_disabled: 'Email OTP sign-in is disabled in Supabase Authentication settings.',
    signup_disabled: 'First-time email sign-in is disabled in Supabase Authentication settings.',
    over_email_send_rate_limit: 'Too many verification emails were requested. Wait before requesting another code.',
    over_request_rate_limit: 'Too many sign-in requests were made. Wait a few minutes and try again.',
    otp_expired: 'This verification code is invalid or expired. Request a new code.',
};
function describeAuthError(cause, fallback) {
    if (isAuthError(cause)) {
        if (cause.code && authErrorMessages[cause.code])
            return authErrorMessages[cause.code];
        const message = cause.message.trim();
        if (message && message !== '{}')
            return message;
        if (cause.status && cause.status >= 500)
            return 'Email authentication failed. Check the Supabase Auth logs and custom SMTP configuration.';
        if ('originalError' in cause)
            return describeAuthError(cause.originalError, fallback);
    }
    if (cause && typeof cause === 'object') {
        const value = cause;
        const code = typeof value.code === 'string' ? value.code : '';
        if (code && authErrorMessages[code])
            return authErrorMessages[code];
        for (const key of ['message', 'msg', 'error_description', 'error']) {
            if (typeof value[key] === 'string' && value[key].trim() && value[key].trim() !== '{}')
                return value[key];
        }
    }
    if (cause instanceof Error && cause.message.trim() && cause.message.trim() !== '{}')
        return cause.message;
    return fallback;
}
export function LoginBackdrop() {
    return (_jsxs("div", { className: "relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-page via-page to-page-2 px-4 py-6", children: [_jsx("div", { "aria-hidden": true, className: "drift absolute -top-32 left-[12%] h-[360px] w-[360px] rounded-full bg-accent/25 blur-[100px]" }), _jsx("div", { "aria-hidden": true, className: "drift-slow absolute -bottom-36 right-[8%] h-[380px] w-[380px] rounded-full bg-[#82a9ff]/20 blur-[110px]" }), _jsx("div", { className: "relative w-full max-w-[860px] overflow-hidden rounded-2xl border border-white/20 bg-white/[0.08] shadow-[0_30px_70px_-28px_rgba(14,24,54,0.65)] backdrop-blur-2xl", children: _jsx("div", { className: "flex items-center justify-center p-12", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20 text-accent font-display text-2xl font-bold shadow-lg shadow-accent/20", children: "S5" }), _jsx("p", { className: "mt-4 text-muted", children: "Loading..." })] }) }) })] }));
}
export function Login({ modal = false, visible = true }) {
    const [type, setType] = useState('fte');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [resendAfter, setResendAfter] = useState(0);
    const [opsId, setOpsId] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    useEffect(() => {
        if (resendAfter <= 0)
            return;
        const timer = window.setTimeout(() => setResendAfter(value => Math.max(0, value - 1)), 1000);
        return () => window.clearTimeout(timer);
    }, [resendAfter]);
    function switchType(next) {
        setType(next);
        setError('');
        setCodeSent(false);
        setCode('');
        setResendAfter(0);
    }
    async function signInWithGoogle() {
        setError('');
        setBusy(true);
        try {
            const { error: signInError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: { hd: 'spxexpress.com', prompt: 'select_account' },
                },
            });
            if (signInError)
                throw signInError;
        }
        catch (cause) {
            setError(describeAuthError(cause, 'Unable to sign in with Google.'));
            setBusy(false);
        }
    }
    async function sendCode(normalizedEmail) {
        if (resendAfter > 0)
            return;
        const { error: sendError } = await supabase.auth.signInWithOtp({
            email: normalizedEmail,
            options: { shouldCreateUser: true },
        });
        if (sendError)
            throw sendError;
        setCodeSent(true);
        setResendAfter(60);
    }
    async function resendCode() {
        setError('');
        setBusy(true);
        try {
            await sendCode(email.trim().toLowerCase());
        }
        catch (cause) {
            setError(describeAuthError(cause, 'Unable to resend the code.'));
        }
        finally {
            setBusy(false);
        }
    }
    async function submit(event, submittedCode) {
        event.preventDefault();
        setError('');
        setBusy(true);
        try {
            if (type === 'fte') {
                const normalized = email.trim().toLowerCase();
                if (!normalized.endsWith('@spxexpress.com'))
                    throw new Error('Use your @spxexpress.com work email.');
                if (!codeSent) {
                    await sendCode(normalized);
                }
                else {
                    const submittedToken = (submittedCode ?? code).trim();
                    if (!/^\d{6}$/.test(submittedToken)) {
                        throw new Error('Enter the 6-digit verification code from your email.');
                    }
                    const { error: verifyError } = await supabase.auth.verifyOtp({
                        email: normalized,
                        token: submittedToken,
                        type: 'email',
                    });
                    if (verifyError)
                        throw verifyError;
                }
            }
            else {
                const { error: signInError } = await supabase.auth.signInWithPassword({ email: backroomEmail(opsId), password });
                if (signInError)
                    throw signInError;
            }
        }
        catch (cause) {
            const fallback = type === 'fte'
                ? codeSent
                    ? 'Unable to verify the code. Request a new code and check the Supabase Auth logs.'
                    : 'Unable to send a verification email. Check the Supabase Auth logs and custom SMTP configuration.'
                : 'Unable to sign in.';
            setError(describeAuthError(cause, fallback));
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs(LoginCard, { modal: modal, visible: visible, children: [_jsxs("div", { className: "mb-4", children: [_jsx("span", { className: "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-faint", children: "Login as" }), _jsx(UserTypeToggle, { value: type, onChange: switchType })] }), type === 'fte' ? (_jsx(FteLoginForm, { email: email, code: code, codeSent: codeSent, resendAfter: resendAfter, busy: busy, error: error, onEmailChange: setEmail, onCodeChange: setCode, onSubmit: submit, onResendCode: resendCode, onGoogleSignIn: signInWithGoogle }, "fte")) : (_jsx(BackroomLoginForm, { opsId: opsId, password: password, showPassword: showPassword, busy: busy, error: error, onOpsIdChange: setOpsId, onPasswordChange: setPassword, onTogglePassword: () => setShowPassword(!showPassword), onSubmit: submit }, "backroom"))] }));
}
