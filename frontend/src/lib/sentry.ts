import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT?.trim() || (import.meta.env.PROD ? 'production' : 'development');
const release = import.meta.env.VITE_SENTRY_RELEASE?.trim() || undefined;
const tracesSampleRate = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0.1');

export const sentryEnabled = Boolean(dsn);

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release,
    sendDefaultPii: false,
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? Math.min(Math.max(tracesSampleRate, 0), 1) : 0.1,
    integrations: [Sentry.browserTracingIntegration()],
  });
}

export { Sentry };
