'use client';
// Signup.jsx
// Registration form. Same Liquid Glass card language as Login.jsx.
// On submit: POST /api/auth/signup -> on success, go to /dashboard.
// Reads ?ref=<userId> from the URL (see Dashboard.jsx's referral link) and
// forwards it so the referrer gets credit.

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BrandLogo from './BrandLogo';

const INPUT =
  'w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-2.5 text-base sm:text-sm font-body ' +
  'text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-400';

export default function Signup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams?.get('ref') || null;

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

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
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, email, password, ref }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not create your account. Please try again.');
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
        <div className="w-16 h-16 mx-auto mb-2 rounded-2xl overflow-hidden flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Bexa Network" className="w-full h-full object-contain" />
        </div>
        <p className="text-center text-[11px] font-body tracking-wide uppercase text-[var(--ink-faint)] mb-4">
          Powered by Bexa Network
        </p>

        <h1 className="font-display font-bold text-2xl text-[var(--ink)] mb-1 text-center">Create your account</h1>
        <p className="font-body text-sm text-[var(--ink-soft)] mb-6 text-center">Free to join. No minimum traffic required.</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            aria-label="Name"
            className={INPUT}
          />
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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min. 8 characters)"
            aria-label="Password"
            className={INPUT}
          />

          {error && (
            <p className="text-sm font-body text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary font-body w-full px-5 py-2.5 rounded-full text-sm mt-1">
            {busy ? 'Creating account…' : 'Get started'}
          </button>
        </form>

        <p className="font-body text-sm text-[var(--ink-soft)] text-center mt-5">
          Already have an account? <a href="/login" className="text-[var(--ink)] font-medium underline">Log in</a>
        </p>
        <div className="text-center mt-2">
          <a href="/" className="text-xs font-body text-[var(--ink-faint)] hover:text-[var(--ink-soft)]">Back to home</a>
        </div>
      </div>
    </div>
  );
}
