import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { supabaseConfigError } from './lib/supabase';
import './styles/tailwind.css';
import './styles/main.css';
import "./styles/template-migration.css";
const client = new QueryClient({ defaultOptions: { queries: { staleTime: 10_000, refetchInterval: 15_000, retry: 1 }, mutations: { retry: 0 } } });
const root = ReactDOM.createRoot(document.getElementById('root'));
if (supabaseConfigError) {
    root.render(_jsxs("main", { className: "state", children: [_jsx("h1", { children: "Configuration error" }), _jsx("p", { className: "error", children: supabaseConfigError }), _jsx("p", { children: "Contact support to finish deployment configuration." })] }));
}
else {
    root.render(_jsx(React.StrictMode, { children: _jsx(QueryClientProvider, { client: client, children: _jsx(ErrorBoundary, { children: _jsx(App, {}) }) }) }));
}
