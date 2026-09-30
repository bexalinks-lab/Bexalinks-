'use client';
// dashboard-kit.jsx — helpers and small UI pieces shared by every dashboard
// section (Dashboard.jsx, ProfileView.jsx, PaymentAccountsView.jsx, ...).

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check } from 'lucide-react';

export const BRAND_GRADIENT = 'bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500';
export const MIN_PAYOUT = 5;
export const PAGE_SIZE = 10;

// ───────────────────────── helpers ─────────────────────────
export const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
export const money = (v) => `$${num(v).toFixed(2)}`;
export const fmtInt = (v) => num(v).toLocaleString();

export function parseDay(d) {
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(`${d}T00:00:00`);
  return new Date(d);
}
export function fmtDay(d) {
  const dt = parseDay(d);
  return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
export function fmtDate(d) {
  const dt = parseDay(d);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

// Short links live on the same domain as the app. If you serve them from a
// different domain, return that domain here instead.
export const shortBase = () => (typeof window !== 'undefined' ? window.location.origin : '');
export const linkCode = (l) => l.short_code || l.custom_alias || '';
export const shortUrlOf = (l) => l.short_url || l.shortUrl || `${shortBase()}/${linkCode(l)}`;

export async function api(url, options) {
  const res = await fetch(url, { credentials: 'same-origin', ...options });
  let data = null;
  try { data = await res.json(); } catch { /* empty / non-JSON body */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export function useFetch(url, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!enabled || !url) return undefined;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api(url)
      .then((data) => { if (!cancelled) setState({ data, error: null, loading: false }); })
      .catch((error) => { if (!cancelled) setState((s) => ({ data: s.data, error, loading: false })); });
    return () => { cancelled = true; };
  }, [url, enabled, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

export function useToast() {
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  const show = useCallback((text, tone = 'ok') => setToast({ text, tone, id: Date.now() }), []);
  return [toast, show];
}

export const PREFS_KEY = 'bexalink.payoutPrefs';
export function loadPrefs() {
  try { return JSON.parse(window.localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
}
export function savePrefs(p) {
  try { window.localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* storage unavailable */ }
}

// ───────────────────────── small UI pieces ─────────────────────────
export const INPUT =
  'w-full bg-white border border-slate-300 hover:border-slate-400 rounded-2xl px-4 py-2.5 text-base sm:text-sm font-body ' +
  'text-[var(--ink)] placeholder-[var(--ink-faint)] transition-colors focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200';

export function Skeleton({ className = 'h-6 w-16' }) {
  return <span className={`inline-block rounded-lg bg-white/60 animate-pulse align-middle ${className}`} />;
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5 px-1">
      <div>
        <h1 className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)]">{title}</h1>
        {subtitle && <p className="font-body text-sm text-[var(--ink-soft)] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorNote({ message, onRetry }) {
  return (
    <div role="alert" className="glass rounded-2xl px-4 py-3 mb-5 flex items-center gap-3 text-sm font-body text-rose-700">
      <AlertCircle size={16} className="shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-secondary px-3 py-1.5 rounded-full text-xs">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children }) {
  return (
    <div className="glass rounded-3xl px-5 py-10 text-center">
      <p className="text-sm font-body text-[var(--ink-faint)]">{children}</p>
    </div>
  );
}

export function StatusBadge({ status }) {
  const s = String(status || 'unknown').toLowerCase();
  const tone =
    ['active', 'paid', 'completed', 'approved'].includes(s) ? 'bg-emerald-500/15 text-emerald-700'
    : ['pending', 'processing', 'review'].includes(s) ? 'bg-amber-500/15 text-amber-700'
    : ['blocked', 'rejected', 'failed', 'cancelled'].includes(s) ? 'bg-rose-500/15 text-rose-700'
    : 'bg-slate-500/10 text-slate-500';
  return <span className={`text-xs px-2.5 py-1 rounded-full font-body font-medium capitalize ${tone}`}>{s}</span>;
}

export function Chips({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`px-3.5 py-1.5 rounded-full text-xs font-body font-medium transition-colors ${
            value === o.value ? 'bg-[var(--ink)] text-white' : 'glass text-[var(--ink-soft)] hover:bg-white/60'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StatCard({ label, value, sublabel, gradient, loading }) {
  return (
    <div className="glass rounded-2xl p-4 sm:p-5 relative overflow-hidden">
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${gradient} opacity-25 blur-2xl`} />
      <p className="text-xs font-body font-medium text-[var(--ink-faint)] mb-1.5 relative z-10">{label}</p>
      <p className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)] relative z-10">
        {loading ? <Skeleton className="h-7 w-20" /> : value}
      </p>
      {sublabel && !loading && <p className="text-xs font-body text-[var(--ink-faint)] mt-1 relative z-10">{sublabel}</p>}
    </div>
  );
}

export function Toast({ toast }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
      {toast && (
        <div
          key={toast.id}
          className={`glass-strong rounded-full px-5 py-2.5 text-sm font-body font-medium shadow-lg flex items-center gap-2 ${
            toast.tone === 'error' ? 'text-rose-700' : 'text-[var(--ink)]'
          }`}
        >
          {toast.tone === 'error' ? <AlertCircle size={15} /> : <Check size={15} className="text-emerald-600" />}
          {toast.text}
        </div>
      )}
    </div>
  );
}


// ── Payout methods (shared by Payouts and Payment accounts) ──
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
export const PAYOUT_METHODS = [
  { key: 'paypal', label: 'PayPal', field: 'PayPal email', placeholder: 'you@example.com', check: (v) => isEmail(v) || 'Enter a valid PayPal email.' },
  { key: 'payoneer', label: 'Payoneer', field: 'Payoneer email', placeholder: 'you@example.com', check: (v) => isEmail(v) || 'Enter a valid Payoneer email.' },
  {
    key: 'bank', label: 'Bank transfer', field: 'Bank details', multiline: true, sensitive: true,
    placeholder: 'Account holder, bank name, account number, IFSC / SWIFT',
    check: (v) => v.length >= 15 || 'Add the account holder, bank, account number and IFSC / SWIFT.',
  },
  {
    key: 'usdt', label: 'USDT', field: 'Wallet address', placeholder: 'Wallet address', networks: ['TRC20', 'ERC20', 'BEP20'],
    check: (v, network) => {
      if (network === 'TRC20') return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(v) || 'A TRC20 address starts with T and is 34 characters long.';
      return /^0x[a-fA-F0-9]{40}$/.test(v) || `A ${network} address starts with 0x and is 42 characters long.`;
    },
  },
  { key: 'upi', label: 'UPI', field: 'UPI ID', placeholder: 'name@bank', check: (v) => /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(v) || 'Enter a valid UPI ID, e.g. name@bank.' },
];

