'use client';
// /logout — calls the API to clear the session cookie, then sends the
// visitor back to the landing page. Having this as a real Next.js page
// (instead of falling through to the Express backend) keeps the whole
// logout round-trip on one origin, so the cookie clears reliably.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
      .catch(() => {})
      .finally(() => { if (!cancelled) router.replace('/'); });
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <p className="font-body text-sm text-[var(--ink-soft)]">Logging out…</p>
    </div>
  );
}
