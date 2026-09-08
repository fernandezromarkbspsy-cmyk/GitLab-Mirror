import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import { supabase } from '../lib/supabase';
export class ErrorBoundary extends Component {
    state = { error: null };
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidCatch(error, info) {
        if (import.meta.env.DEV) {
            console.error('Unhandled React error', error, info);
        }
    }
    render() {
        if (!this.state.error)
            return this.props.children;
        return _jsxs("main", { className: "state", children: [_jsx("h1", { children: "Something went wrong" }), _jsx("p", { className: "error", children: "The application hit an unexpected error." }), _jsx("button", { onClick: () => window.location.reload(), children: "Reload" }), " ", _jsx("button", { onClick: () => void supabase.auth.signOut(), children: "Sign out" })] });
    }
}
