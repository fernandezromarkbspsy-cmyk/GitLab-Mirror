import * as Sentry from "@sentry/react";

const clampSampleRate = (value: unknown, fallback: number): number => {
  const parsed = Number.parseFloat(String(value ?? ""));

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 0), 1);
};

const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
const environment =
  import.meta.env.VITE_SENTRY_ENVIRONMENT?.trim() ||
  (import.meta.env.PROD ? "production" : "development");
const release = import.meta.env.VITE_SENTRY_RELEASE?.trim() || undefined;
const tracesSampleRate = clampSampleRate(
  import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE,
  0.1,
);

export const sentryEnabled = Boolean(dsn);

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release,
    sendDefaultPii: false,
    tracesSampleRate,
    integrations: [Sentry.browserTracingIntegration()],
  });
}

export { Sentry };

Sentry.captureException(new Error("SOC5 Sentry frontend test"));
