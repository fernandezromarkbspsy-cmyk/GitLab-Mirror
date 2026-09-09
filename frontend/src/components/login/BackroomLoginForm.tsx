import { useState } from "react";
import { ArrowRight, Eye, EyeOff, IdCard, Loader2, Lock } from "lucide-react";
import { api } from "../../lib/api";

interface BackroomLoginFormProps {
  opsId: string;
  password: string;
  showPassword: boolean;
  busy: boolean;
  error: string;
  onOpsIdChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function BackroomLoginForm({
  opsId,
  password,
  showPassword,
  busy,
  error,
  onOpsIdChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}: BackroomLoginFormProps) {
  const [shaking, setShaking] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestName, setRequestName] = useState("");
  const [requestedOpsId, setRequestedOpsId] = useState("");
  const [requestError, setRequestError] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [requestBusy, setRequestBusy] = useState(false);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  // Trigger shake animation when there's an error
  if (error && !shaking) {
    triggerShake();
  }

  async function submitAccessRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError("");
    setRequestBusy(true);
    try {
      await api("/access-requests", {
        method: "POST",
        body: JSON.stringify({ name: requestName.trim(), ops_id: requestedOpsId.trim() }),
      });
      setRequestSent(true);
    } catch (cause) {
      setRequestError(cause instanceof Error ? cause.message : "Unable to send the access request.");
    } finally {
      setRequestBusy(false);
    }
  }

  if (requestOpen) {
    return (
      <form className="rise w-full" onSubmit={submitAccessRequest}>
        <h2 className="font-display text-[17px] font-bold text-ink leading-snug tracking-tight">
          Request Backroom access
        </h2>
        <p className="mt-1.5 text-[12.5px] text-muted leading-relaxed">
          An FTE user will review your details before creating an account.
        </p>
        <label htmlFor="access-request-name" className="mt-4 block text-[11.5px] font-bold uppercase tracking-wider text-faint">
          Full name
        </label>
        <input
          id="access-request-name"
          value={requestName}
          onChange={(event) => setRequestName(event.target.value)}
          required
          maxLength={120}
          className="mt-1.5 h-10 w-full rounded-lg border border-line bg-white/[0.07] px-3 text-[13px] text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/20"
        />
        <label htmlFor="access-request-ops-id" className="mt-3 block text-[11.5px] font-bold uppercase tracking-wider text-faint">
          Requested Ops ID
        </label>
        <input
          id="access-request-ops-id"
          value={requestedOpsId}
          onChange={(event) => setRequestedOpsId(event.target.value.toUpperCase())}
          placeholder="OPS123"
          required
          pattern="[Oo][Pp][Ss][0-9]+"
          maxLength={40}
          className="mt-1.5 h-10 w-full rounded-lg border border-line bg-white/[0.07] px-3 text-[13px] uppercase text-ink outline-none placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent/20"
        />
        {requestError && <p className="mt-2 text-[12px] font-medium text-danger leading-snug">{requestError}</p>}
        {requestSent ? (
          <p className="mt-3 text-[12px] font-medium text-success leading-snug">
            Request sent. An FTE user will review and create your account.
          </p>
        ) : (
          <div className="mt-4 flex items-center gap-3">
            <button type="submit" disabled={requestBusy} className="text-[12px] font-bold text-link disabled:opacity-50">
              {requestBusy ? "Sending..." : "Send request"}
            </button>
            <button type="button" onClick={() => setRequestOpen(false)} className="text-[12px] font-semibold text-muted hover:text-ink">
              Cancel
            </button>
          </div>
        )}
      </form>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="rise w-full">
      <h2 className="font-display text-[17px] font-bold text-ink leading-snug tracking-tight">
        Backroom sign in
      </h2>
      <p className="mt-1.5 text-[12.5px] text-muted leading-relaxed">
        Use your assigned Ops ID and password.
      </p>

      {/* Ops ID */}
      <label
        htmlFor="backroom-ops-id"
        className="mt-4 block text-[11.5px] font-bold uppercase tracking-wider text-faint"
      >
        Ops ID
      </label>
      <div
        className={`mt-1.5 flex h-11 items-stretch rounded-xl border bg-white/[0.07] transition-all duration-200 focus-within:border-accent focus-within:bg-white/[0.11] focus-within:ring-4 focus-within:ring-accent/20 ${
          shaking ? "animate-shake" : ""
        } ${error ? "border-danger/70" : "border-line"}`}
      >
        <span className="grid w-10 shrink-0 place-items-center text-faint">
          <IdCard className="h-4 w-4" />
        </span>
        <input
          value={opsId}
          onChange={(e) => onOpsIdChange(e.target.value.toUpperCase())}
          placeholder="SOC5-0000"
          id="backroom-ops-id"
          aria-label="Ops ID"
          autoComplete="username"
          className="min-w-0 flex-1 bg-transparent pr-3 text-[13.5px] tracking-wide text-ink outline-none placeholder:text-faint uppercase"
        />
      </div>

      {/* Password */}
      <label
        htmlFor="backroom-password"
        className="mt-3.5 block text-[11.5px] font-bold uppercase tracking-wider text-faint"
      >
        Password
      </label>
      <div
        className={`mt-1.5 flex h-11 items-stretch rounded-xl border bg-white/[0.07] transition-all duration-200 focus-within:border-accent focus-within:bg-white/[0.11] focus-within:ring-4 focus-within:ring-accent/20 ${
          error ? "border-danger/70" : "border-line"
        }`}
      >
        <span className="grid w-10 shrink-0 place-items-center text-faint">
          <Lock className="h-4 w-4" />
        </span>
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="••••••••"
          id="backroom-password"
          aria-label="Password"
          autoComplete="current-password"
          className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-faint"
        />
        <button
          type="button"
          onClick={onTogglePassword}
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="px-3 text-faint transition-colors hover:text-ink"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {error && <p className="mt-2.5 text-[12px] font-medium text-danger leading-snug">{error}</p>}

      <div className="mt-3.5 flex items-center justify-between">
        <label className="group flex cursor-pointer items-center gap-2 text-[12px] font-medium text-muted leading-snug">
          <span
            className={`grid h-4 w-4 place-items-center rounded border transition-all duration-200 ${
              true
                ? "border-accent bg-accent"
                : "border-white/30 bg-white/[0.07] group-hover:border-white/50"
            }`}
          >
            {true && (
              <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
                <path
                  d="M2.5 6.3 4.8 8.6 9.5 3.9"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <input type="checkbox" className="sr-only" defaultChecked />
          Keep me signed in
        </label>
        <a
          href="/login"
          className="text-[12px] font-bold text-link underline-offset-4 hover:underline tracking-tight"
        >
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="btn-shine group mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-2 font-display text-[14px] font-bold text-white shadow-lg shadow-accent/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/40 hover:brightness-110 active:translate-y-0 disabled:cursor-wait disabled:opacity-85 tracking-tight"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-bold">Signing in…</span>
          </>
        ) : (
          <>
            <span className="font-bold">Sign In</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </>
        )}
      </button>

      <p className="mt-3.5 text-center text-[12px] text-muted leading-snug">
        Need an Ops ID?{" "}
        <button
          type="button"
          onClick={() => setRequestOpen(true)}
          className="font-bold text-link underline-offset-4 hover:underline tracking-tight"
        >
          Request access
        </button>
      </p>
    </form>
  );
}
