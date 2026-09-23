'use client';
// Login.jsx
// Email/password login. Same Liquid Glass card language as the dashboard's
// SignedOut screen and the landing page's ClosingCTA, so the whole flow
// feels like one product instead of three separate pages.
//
// On submit: POST /api/auth/login -> on success, go to /dashboard.
// If the visitor is already logged in (GET /api/auth/me succeeds), skip
// straight to /dashboard instead of showing the form again.

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BrandLogo from './BrandLogo';

const INPUT =
  'w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-2.5 text-base sm:text-sm font-body ' +
  'text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-400';

const GOOGLE_ERRORS = {
  google_denied: 'Google sign-in was cancelled.',
  google_failed: 'Could not sign in with Google. Please try again.',
  banned: 'This account has been suspended.',
};

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4 3.11C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(() => GOOGLE_ERRORS[searchParams?.get('error')] || null);
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Already logged in? Skip the form.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((res) => {
        if (!cancelled && res.ok) router.replace('/dashboard');
        else if (!cancelled) setCheckingSession(false);
      })
      .catch(() => { if (!cancelled) setCheckingSession(false); });
    return () => { cancelled = true; };
  }, [router]);

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not log in. Please try again.');
        setBusy(false);
        return;
      }
      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  if (checkingSession) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="relative w-full max-w-sm p-8 overflow-hidden glass-strong" style={{ borderRadius: 40 }}>
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-200/60 via-sky-100/40 to-pink-100/50" />
        <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 opacity-25 blur-2xl -z-10" />

        <div className="flex justify-center mb-6"><BrandLogo href="/" /></div>

        <h1 className="font-display font-bold text-[1.7rem] text-[var(--ink)] mb-1.5 text-center">Welcome back</h1>
        <p className="font-body text-sm text-[var(--ink-soft)] mb-7 text-center leading-relaxed">Log in to see your earnings, links and payouts.</p>

        <a
          href="/api/auth/google"
          className="btn btn-secondary font-body w-full py-2.5 rounded-full text-sm flex items-center justify-center gap-2.5"
        >
          <GoogleLogo />
          Continue with Google
        </a>

        <div className="flex items-center gap-3 my-5">
          <span className="flex-1 h-px bg-black/10" />
          <span className="text-xs font-body text-[var(--ink-faint)]">or</span>
          <span className="flex-1 h-px bg-black/10" />
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email"
            className={INPUT}
          />
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            aria-label="Password"
            className={INPUT}
          />

          {error && (
            <p className="text-sm font-body text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary font-body w-full py-2.5 rounded-full text-sm mt-1">
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="font-body text-sm text-[var(--ink-soft)] text-center mt-6">
          New to Bexalink? <a href="/signup" className="text-[var(--ink)] font-medium underline">Sign up</a>
        </p>
        <div className="text-center mt-2">
          <a href="/" className="text-xs font-body text-[var(--ink-faint)] hover:text-[var(--ink-soft)]">Back to home</a>
        </div>
      </div>
    </div>
  );
}
