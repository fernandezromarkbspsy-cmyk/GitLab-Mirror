import { Component, type ErrorInfo, type ReactNode } from "react";
import { Sentry, sentryEnabled } from "../lib/sentry";
import { supabase } from "../lib/supabase";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("Unhandled React error", error, info);
    }

    if (sentryEnabled) {
      Sentry.withScope((scope) => {
        scope.setContext("react", { componentStack: info.componentStack });
        Sentry.captureException(error);
      });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="state">
        <h1>Something went wrong</h1>
        <p className="error">The application hit an unexpected error.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload
        </button>{" "}
        <button type="button" onClick={() => void supabase.auth.signOut()}>
          Sign out
        </button>
      </main>
    );
  }
}
