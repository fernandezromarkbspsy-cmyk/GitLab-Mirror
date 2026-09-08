import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
export function ChangePassword({ onComplete }) {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function submit(e) { e.preventDefault(); setError(''); if (password.length < 12)
        return setError('Password must be at least 12 characters.'); if (password !== confirm)
        return setError('Passwords do not match.'); setBusy(true); try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error)
            throw error;
        await api('/auth/password-changed', { method: 'POST' });
        onComplete();
    }
    catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to change password.');
    }
    finally {
        setBusy(false);
    } }
    return _jsxs("main", { className: "login", children: [_jsxs("section", { children: [_jsx("p", { className: "eyebrow", children: "FIRST LOGIN" }), _jsx("h1", { children: "Secure your account" }), _jsx("p", { children: "Replace the shared initial password before continuing." })] }), _jsxs("form", { onSubmit: submit, children: [_jsx("h2", { children: "Change password" }), _jsxs("label", { children: ["New password", _jsx("input", { type: "password", autoComplete: "new-password", required: true, value: password, onChange: e => setPassword(e.target.value) })] }), _jsxs("label", { children: ["Confirm password", _jsx("input", { type: "password", autoComplete: "new-password", required: true, value: confirm, onChange: e => setConfirm(e.target.value) })] }), error && _jsx("p", { className: "error", role: "alert", children: error }), _jsx("button", { disabled: busy, children: busy ? 'Saving…' : 'Change password' })] })] });
}
