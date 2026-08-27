import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
export function ChangePassword({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) { e.preventDefault(); setError(''); if (password.length < 12) return setError('Password must be at least 12 characters.'); if (password !== confirm) return setError('Passwords do not match.'); setBusy(true); try { const { error } = await supabase.auth.updateUser({ password }); if (error) throw error; await api('/auth/password-changed', { method: 'POST' }); onComplete(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to change password.'); } finally { setBusy(false); } }
  return <main className="login"><section><p className="eyebrow">FIRST LOGIN</p><h1>Secure your account</h1><p>Replace the shared initial password before continuing.</p></section><form onSubmit={submit}><h2>Change password</h2><label>New password<input type="password" autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} /></label><label>Confirm password<input type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} /></label>{error && <p className="error" role="alert">{error}</p>}<button disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button></form></main>;
}
