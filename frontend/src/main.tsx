import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { supabaseConfigError } from './lib/supabase';
import './lib/sentry';
import './styles/tokens.css';
import './styles/tailwind.css';
import './styles/main.css';
import "./styles/template-migration.css";

const client = new QueryClient({ defaultOptions: { queries: { staleTime: 10_000, retry: 1 }, mutations: { retry: 0 } } });
const root = ReactDOM.createRoot(document.getElementById('root')!);

if (supabaseConfigError) {
  root.render(<main className="state"><h1>Configuration error</h1><p className="error">{supabaseConfigError}</p><p>Contact support to finish deployment configuration.</p></main>);
} else {
  root.render(<React.StrictMode><BrowserRouter><QueryClientProvider client={client}><ErrorBoundary><App /></ErrorBoundary></QueryClientProvider></BrowserRouter></React.StrictMode>);
}
