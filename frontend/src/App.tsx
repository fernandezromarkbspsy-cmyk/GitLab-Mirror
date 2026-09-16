import {
  Fragment,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { LoginBackdrop } from "./components/login/LoginBackdrop";
import { ApiError, api } from "./lib/api";
import { supabase } from "./lib/supabase";
import {
  clearBackendAccessToken,
  getBackendAccessToken,
  onBackendAuthChange,
} from "./lib/backendAuth";
import { ChangePassword } from "./pages/ChangePassword";
import type { User } from "./types";

type AppState =
  | "loading"
  | "signed-out"
  | "unauthorized"
  | "change-password"
  | "ready";

type Failure = {
  title: string;
  message: string;
  detail: string;
};

const Login = lazy(() =>
  import("./pages/Login").then((module) => ({ default: module.Login })),
);

const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })),
);

const defaultFailure: Failure = {
  title: "Account access failed",
  message: "Unable to load your account.",
  detail: "Sign-in succeeded, but the application could not load your account.",
};

function describeFailure(cause: unknown): Failure {
  if (!(cause instanceof ApiError)) {
    return {
      ...defaultFailure,
      message: cause instanceof Error ? cause.message : defaultFailure.message,
    };
  }

  if (cause.status === 403) {
    return {
      title: "Account not provisioned",
      message: cause.message,
      detail:
        "Your sign-in succeeded, but this account does not have active application access.",
    };
  }

  if (cause.status === 503) {
    return {
      title: "Authentication service unavailable",
      message: cause.message,
      detail:
        "The API server cannot use its Supabase configuration. Retry after the deployment configuration is corrected.",
    };
  }

  return {
    ...defaultFailure,
    message: cause.message,
    detail:
      cause.status === 401
        ? "The API rejected this session. Sign out, then sign in again."
        : defaultFailure.detail,
  };
}

export default function App() {
  const navigate = useNavigate();
  const [state, setState] = useState<AppState>("loading");
  const [failure, setFailure] = useState<Failure>(defaultFailure);
  const [profile, setProfile] = useState<User | null>(null);
  const lastToken = useRef<string | null>(null);
  const requestSequence = useRef(0);

  const signOut = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      clearBackendAccessToken();
      await supabase.auth.signOut();
    }
  }, []);

  const resolveSession = useCallback(
    async (session: { access_token: string } | null, force = false) => {
      if (!session) {
        lastToken.current = null;
        requestSequence.current += 1;
        setProfile(null);
        setState("signed-out");
        return;
      }

      if (!force && lastToken.current === session.access_token) return;

      lastToken.current = session.access_token;
      const requestId = ++requestSequence.current;

      try {
        const resolvedProfile = await api<User>("/auth/me");
        if (requestId !== requestSequence.current) return;
        setProfile(resolvedProfile);
        if (
          window.location.pathname === "/" ||
          window.location.pathname === "/login"
        ) {
          navigate("/dashboard", { replace: true });
        }
        setState(
          resolvedProfile.must_change_password ? "change-password" : "ready",
        );
      } catch (cause) {
        if (requestId !== requestSequence.current) return;
        setFailure(describeFailure(cause));
        setState("unauthorized");
      }
    },
    [navigate],
  );

  const retrySession = useCallback(async () => {
    setState("loading");
    const backendAccessToken = getBackendAccessToken();
    if (backendAccessToken) {
      await resolveSession({ access_token: backendAccessToken }, true);
      return;
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setFailure(describeFailure(error));
      setState("unauthorized");
      return;
    }
    await resolveSession(data.session, true);
  }, [resolveSession]);

  useEffect(() => {
    const backendAccessToken = getBackendAccessToken();
    const removeBackendListener = onBackendAuthChange(() => {
      const token = getBackendAccessToken();
      void resolveSession(token ? { access_token: token } : null, true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (getBackendAccessToken()) return;
      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "SIGNED_OUT" ||
        event === "TOKEN_REFRESHED"
      ) {
        window.setTimeout(() => void resolveSession(session), 0);
      }
    });
    if (backendAccessToken) void resolveSession({ access_token: backendAccessToken }, true);
    return () => {
      removeBackendListener();
      data.subscription.unsubscribe();
    };
  }, [resolveSession]);

  if (state === "loading") return <LoginBackdrop />;
  if (state === "signed-out") return <UnauthenticatedEntry />;
  if (state === "unauthorized") {
    return (
      <main className="state">
        <h1>{failure.title}</h1>
        <p className="error">{failure.message}</p>
        <p>{failure.detail}</p>
        <button type="button" onClick={() => void retrySession()}>
          Try again
        </button>{" "}
        <button type="button" onClick={() => void signOut()}>
          Sign out
        </button>
      </main>
    );
  }
  if (state === "change-password")
    return <ChangePassword onComplete={() => setState("ready")} />;
  return profile ? (
    <Suspense fallback={<LoginBackdrop />}>
      <Dashboard user={profile} onSignOut={() => void signOut()} />
    </Suspense>
  ) : (
    <LoginBackdrop />
  );
}

function UnauthenticatedEntry() {
  const [loginVisible, setLoginVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoginVisible(true), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  const previewUser: User = {
    id: "preview-user",
    name: "Operations preview",
    role: "ops_pic",
    is_admin: false,
    email: "preview@soc5express.com",
  };

  return (
    <Fragment>
      <div className="dashboard-preview">
        <Suspense fallback={<LoginBackdrop />}>
          <Dashboard user={previewUser} preview />
        </Suspense>
      </div>
      <Suspense fallback={<LoginBackdrop />}>
        <Login modal visible={loginVisible} />
      </Suspense>
    </Fragment>
  );
}
