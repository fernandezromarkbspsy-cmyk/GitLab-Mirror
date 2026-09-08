import { FormEvent, useEffect, useState } from 'react';
import { isAuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { LoginCard } from '../components/login/LoginCard';
import { UserTypeToggle } from '../components/login/UserTypeToggle';
import { FteLoginForm } from '../components/login/FteLoginForm';
import { BackroomLoginForm } from '../components/login/BackroomLoginForm';

export type UserType = 'fte' | 'backroom';

const backroomEmail = (opsId: string) => `${opsId.trim().toLowerCase()}@backroom.soc5.internal`;
const authErrorMessages: Record<string, string> = {
  email_address_not_authorized: 'Email delivery is not configured for this address. Ask an administrator to enable custom SMTP in Supabase.',
  email_provider_disabled: 'Email sign-in is disabled in Supabase Authentication settings.',
  otp_disabled: 'Email OTP sign-in is disabled in Supabase Authentication settings.',
  signup_disabled: 'First-time email sign-in is disabled in Supabase Authentication settings.',
  over_email_send_rate_limit: 'Too many verification emails were requested. Wait before requesting another code.',
  over_request_rate_limit: 'Too many sign-in requests were made. Wait a few minutes and try again.',
  otp_expired: 'This verification code is invalid or expired. Request a new code.',
};

function describeAuthError(cause: unknown, fallback: string): string {
  if (isAuthError(cause)) {
    if (cause.code && authErrorMessages[cause.code]) return authErrorMessages[cause.code];
    const message = cause.message.trim();
    if (message && message !== '{}') return message;
    if (cause.status && cause.status >= 500) return 'Email authentication failed. Check the Supabase Auth logs and custom SMTP configuration.';
    if ('originalError' in cause) return describeAuthError(cause.originalError, fallback);
  }
  if (cause && typeof cause === 'object') {
    const value = cause as Record<string, unknown>;
    const code = typeof value.code === 'string' ? value.code : '';
    if (code && authErrorMessages[code]) return authErrorMessages[code];
    for (const key of ['message', 'msg', 'error_description', 'error']) {
      if (typeof value[key] === 'string' && value[key].trim() && value[key].trim() !== '{}') return value[key];
    }
  }
  if (cause instanceof Error && cause.message.trim() && cause.message.trim() !== '{}') return cause.message;
  return fallback;
}

export function Login({ modal = false, visible = true }: { modal?: boolean; visible?: boolean }) {
  const [type, setType] = useState<UserType>('fte');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [resendAfter, setResendAfter] = useState(0);
  const [opsId, setOpsId] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (resendAfter <= 0) return;
    const timer = window.setTimeout(() => setResendAfter(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendAfter]);

  function switchType(next: UserType) {
    setType(next);
    setError('');
    setCodeSent(false);
    setCode('');
    setResendAfter(0);
  }

  async function signInWithGoogle() {
    setError('');
    setBusy(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: { hd: 'spxexpress.com', prompt: 'select_account' },
        },
      });
      if (signInError) throw signInError;
    } catch (cause) {
      setError(describeAuthError(cause, 'Unable to sign in with Google.'));
      setBusy(false);
    }
  }

  async function sendCode(normalizedEmail: string) {
    if (resendAfter > 0) return;
    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: true },
    });
    if (sendError) throw sendError;
    setCodeSent(true);
    setResendAfter(60);
  }

  async function resendCode() {
    setError('');
    setBusy(true);
    try {
      await sendCode(email.trim().toLowerCase());
    } catch (cause) {
      setError(describeAuthError(cause, 'Unable to resend the code.'));
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent, submittedCode?: string) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (type === 'fte') {
        const normalized = email.trim().toLowerCase();
        if (!normalized.endsWith('@spxexpress.com')) throw new Error('Use your @spxexpress.com work email.');
        if (!codeSent) {
          await sendCode(normalized);
      } else {
        const submittedToken = (submittedCode ?? code).trim();
        if (!/^\d{6}$/.test(submittedToken)) {
          throw new Error('Enter the 6-digit verification code from your email.');
        }
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: normalized,
          token: submittedToken,
          type: 'email',
        });
          if (verifyError) throw verifyError;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: backroomEmail(opsId), password });
        if (signInError) throw signInError;
      }
    } catch (cause) {
      const fallback = type === 'fte'
        ? codeSent
          ? 'Unable to verify the code. Request a new code and check the Supabase Auth logs.'
          : 'Unable to send a verification email. Check the Supabase Auth logs and custom SMTP configuration.'
        : 'Unable to sign in.';
      setError(describeAuthError(cause, fallback));
    } finally {
      setBusy(false);
    }
  }

  return (
    <LoginCard modal={modal} visible={visible}>
      <div className="mb-4">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">
          Login as
        </span>
        <UserTypeToggle value={type} onChange={switchType} />
      </div>

      {type === 'fte' ? (
        <FteLoginForm
          key="fte"
          email={email}
          code={code}
          codeSent={codeSent}
          resendAfter={resendAfter}
          busy={busy}
          error={error}
          onEmailChange={setEmail}
          onCodeChange={setCode}
          onSubmit={submit}
          onResendCode={resendCode}
          onGoogleSignIn={signInWithGoogle}
        />
      ) : (
        <BackroomLoginForm
          key="backroom"
          opsId={opsId}
          password={password}
          showPassword={showPassword}
          busy={busy}
          error={error}
          onOpsIdChange={setOpsId}
          onPasswordChange={setPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          onSubmit={submit}
        />
      )}
    </LoginCard>
  );
}
