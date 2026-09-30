import { FormEvent, useState } from "react";
import { api } from "../lib/api";
export function ChangePassword({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 12)
      return setError("Password must be at least 12 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    try {
      await api("/auth/password-changed", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      onComplete();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Unable to change password.";

      if (/too many attempts|rate limit|too many requests/i.test(message)) {
        setError(
          "Too many password change attempts. Please wait a few minutes and try again.",
        );
        return;
      }

      setError(message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login">
      <section>
        <p className="mb-[0.35rem] text-soc5-lime-deep text-[0.72rem] font-bold tracking-[0.08em] uppercase">FIRST LOGIN</p>
        <h1>Secure your account</h1>
        <p>Set a permanent password before continuing.</p>
      </section>
      <form onSubmit={submit}>
        <h2>Change password</h2>
        <label>
          New password
          <input
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        {error && (
          <p className="error text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Change password"}
        </button>
      </form>
    </main>
  );
}
