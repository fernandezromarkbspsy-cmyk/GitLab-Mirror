import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './lib/supabase';
import { api, ApiError } from './lib/api';
import { Dashboard } from './pages/Dashboard';
import { Login, LoginBackdrop } from './pages/Login.tsx';
import { ChangePassword } from './pages/ChangePassword';
const defaultFailure = {
    title: 'Account access failed',
    message: 'Unable to load your account.',
    detail: 'Sign-in succeeded, but the application could not load your account.',
};
function describeFailure(cause) {
    if (!(cause instanceof ApiError)) {
        return { ...defaultFailure, message: cause instanceof Error ? cause.message : defaultFailure.message };
    }
    if (cause.status === 403) {
        return {
            title: 'Account not provisioned',
            message: cause.message,
            detail: 'Your sign-in succeeded, but this account does not have active application access.',
        };
    }
    if (cause.status === 503) {
        return {
            title: 'Authentication service unavailable',
            message: cause.message,
            detail: 'The API server cannot use its Supabase configuration. Retry after the deployment configuration is corrected.',
        };
    }
    return {
        ...defaultFailure,
        message: cause.message,
        detail: cause.status === 401
            ? 'The API rejected this session. Sign out, then sign in again.'
            : defaultFailure.detail,
    };
}
export default function App() {
    const [state, setState] = useState('loading');
    const [failure, setFailure] = useState(defaultFailure);
    const [profile, setProfile] = useState(null);
    const lastToken = useRef(null);
    const requestSequence = useRef(0);
    const resolveSession = useCallback(async (session, force = false) => {
        if (!session) {
            lastToken.current = null;
            requestSequence.current += 1;
            setProfile(null);
            window.history.replaceState({}, '', '/');
            setState('signed-out');
            return;
        }
        if (!force && lastToken.current === session.access_token)
            return;
        lastToken.current = session.access_token;
        const requestId = ++requestSequence.current;
        try {
            const resolvedProfile = await api('/auth/me');
            if (requestId !== requestSequence.current)
                return;
            setProfile(resolvedProfile);
            if (window.location.pathname === '/' || window.location.pathname === '/login') {
                window.history.replaceState({}, '', '/dashboard');
            }
            setState(resolvedProfile.must_change_password ? 'change-password' : 'ready');
        }
        catch (cause) {
            if (requestId !== requestSequence.current)
                return;
            // Keep the session so temporary API failures can be retried in place.
            setFailure(describeFailure(cause));
            setState('unauthorized');
        }
    }, []);
    const retrySession = useCallback(async () => {
        setState('loading');
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            setFailure(describeFailure(error));
            setState('unauthorized');
            return;
        }
        await resolveSession(data.session, true);
    }, [resolveSession]);
    useEffect(() => {
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                // Supabase advises against awaiting other auth calls inside this callback.
                window.setTimeout(() => void resolveSession(session), 0);
            }
        });
        return () => data.subscription.unsubscribe();
    }, [resolveSession]);
    if (state === 'loading')
        return _jsx(LoginBackdrop, {});
    if (state === 'signed-out')
        return _jsx(UnauthenticatedEntry, {});
    if (state === 'unauthorized')
        return _jsxs("main", { className: "state", children: [_jsx("h1", { children: failure.title }), _jsx("p", { className: "error", children: failure.message }), _jsx("p", { children: failure.detail }), _jsx("button", { onClick: () => void retrySession(), children: "Try again" }), " ", _jsx("button", { onClick: () => void supabase.auth.signOut(), children: "Sign out" })] });
    if (state === 'change-password')
        return _jsx(ChangePassword, { onComplete: () => setState('ready') });
    return profile ? _jsx(Dashboard, { user: profile }) : _jsx(LoginBackdrop, {});
}

function UnauthenticatedEntry() {
    const [loginVisible, setLoginVisible] = useState(false);
    useEffect(() => {
        const timer = window.setTimeout(() => setLoginVisible(true), 2000);
        return () => window.clearTimeout(timer);
    }, []);
    const previewUser = {
        id: 'preview-user',
        name: 'Operations preview',
        role: 'ops_pic',
        is_admin: false,
        email: 'preview@soc5express.com',
    };
    return _jsxs(Fragment, { children: [_jsx("div", { className: "dashboard-preview", children: _jsx(Dashboard, { user: previewUser }) }), _jsx(Login, { modal: true, visible: loginVisible })] });
}
