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
import { useRouter } from 'next/navigation';
import { Wallet } from 'lucide-react';
import BrandLogo from './BrandLogo';

const BRAND_GRADIENT = 'bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500';
const INPUT =
  'w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-2.5 text-base sm:text-sm font-body ' +
  'text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-400';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
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
      <div className="relative w-full max-w-sm p-7 overflow-hidden glass-strong" style={{ borderRadius: 40 }}>
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-200/60 via-sky-100/40 to-pink-100/50" />

        <div className="flex justify-center mb-5"><BrandLogo href="/" /></div>
        <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl ${BRAND_GRADIENT} flex items-center justify-center shadow-lg relative overflow-hidden`}>
          <div className="glass-shine" />
          <Wallet size={26} className="text-white relative z-10" />
        </div>

        <h1 className="font-display font-bold text-2xl text-[var(--ink)] mb-1 text-center">Welcome back</h1>
        <p className="font-body text-sm text-[var(--ink-soft)] mb-6 text-center">Log in to see your earnings, links and payouts.</p>

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

          <button type="submit" disabled={busy} className="btn btn-primary font-body w-full px-5 py-2.5 rounded-full text-sm mt-1">
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="font-body text-sm text-[var(--ink-soft)] text-center mt-5">
          New to Bexalink? <a href="/signup" className="text-[var(--ink)] font-medium underline">Sign up</a>
        </p>
        <div className="text-center mt-2">
          <a href="/" className="text-xs font-body text-[var(--ink-faint)] hover:text-[var(--ink-soft)]">Back to home</a>
        </div>
      </div>
    </div>
  );
}
