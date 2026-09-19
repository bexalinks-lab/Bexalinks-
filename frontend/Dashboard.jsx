'use client';
// Dashboard.jsx
// Publisher dashboard for Bexalink — Liquid Glass design (see app/globals.css).
//
// One page, six working sections switched from the sidebar (no extra route
// files needed; the active section is kept in the URL hash, e.g. #payouts):
//   Overview · Links · Earnings · Referrals · Payouts · Settings
//
// API used
//   existing : GET  /api/dashboard/summary
//              GET  /api/dashboard/links
//              GET  /api/dashboard/earnings-trend?days=N
//              POST /api/links            { destinationUrl, customAlias? }
//   new      : GET  /api/dashboard/referrals   (optional — see ReferralsView)
//              GET  /api/payouts               → [{ id, amount, method, status, created_at }]
//              POST /api/payouts               { amount, method, account, network? }
// If a "new" endpoint is missing the dashboard shows a friendly message
// instead of breaking, so you can add them one by one.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Link2, Wallet, Users, TrendingUp, Copy, Settings, LogOut, LayoutDashboard,
  RefreshCw, ExternalLink, Search, Check, Share2, AlertCircle, Shield,
} from 'lucide-react';
import BrandLogo from './BrandLogo';

const BRAND_GRADIENT = 'bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500';
const MIN_PAYOUT = 5;
const PAGE_SIZE = 10;

// ───────────────────────── helpers ─────────────────────────
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const money = (v) => `$${num(v).toFixed(2)}`;
const fmtInt = (v) => num(v).toLocaleString();

function parseDay(d) {
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(`${d}T00:00:00`);
  return new Date(d);
}
function fmtDay(d) {
  const dt = parseDay(d);
  return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
function fmtDate(d) {
  const dt = parseDay(d);
  return Number.isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

async function copyText(text) {
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
const shortBase = () => (typeof window !== 'undefined' ? window.location.origin : '');
const linkCode = (l) => l.short_code || l.custom_alias || '';
const shortUrlOf = (l) => l.short_url || l.shortUrl || `${shortBase()}/${linkCode(l)}`;

async function api(url, options) {
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

function useFetch(url, { enabled = true } = {}) {
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

function useToast() {
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  const show = useCallback((text, tone = 'ok') => setToast({ text, tone, id: Date.now() }), []);
  return [toast, show];
}

const PREFS_KEY = 'bexalink.payoutPrefs';
function loadPrefs() {
  try { return JSON.parse(window.localStorage.getItem(PREFS_KEY)) || {}; } catch { return {}; }
}
function savePrefs(p) {
  try { window.localStorage.setItem(PREFS_KEY, JSON.stringify(p)); } catch { /* storage unavailable */ }
}

// ───────────────────────── small UI pieces ─────────────────────────
const INPUT =
  'w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-2.5 text-base sm:text-sm font-body ' +
  'text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-400';

function Skeleton({ className = 'h-6 w-16' }) {
  return <span className={`inline-block rounded-lg bg-white/60 animate-pulse align-middle ${className}`} />;
}

function PageHeader({ title, subtitle, action }) {
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

function ErrorNote({ message, onRetry }) {
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

function EmptyState({ children }) {
  return (
    <div className="glass rounded-3xl px-5 py-10 text-center">
      <p className="text-sm font-body text-[var(--ink-faint)]">{children}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = String(status || 'unknown').toLowerCase();
  const tone =
    ['active', 'paid', 'completed', 'approved'].includes(s) ? 'bg-emerald-500/15 text-emerald-700'
    : ['pending', 'processing', 'review'].includes(s) ? 'bg-amber-500/15 text-amber-700'
    : ['blocked', 'rejected', 'failed', 'cancelled'].includes(s) ? 'bg-rose-500/15 text-rose-700'
    : 'bg-slate-500/10 text-slate-500';
  return <span className={`text-xs px-2.5 py-1 rounded-full font-body font-medium capitalize ${tone}`}>{s}</span>;
}

function Chips({ options, value, onChange, label }) {
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

function StatCard({ label, value, sublabel, gradient, loading }) {
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

function Toast({ toast }) {
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

// ───────────────────────── navigation ─────────────────────────
const TABS = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard, gradient: BRAND_GRADIENT },
  { key: 'links', label: 'Links', icon: Link2, gradient: 'bg-gradient-to-br from-indigo-400 to-indigo-600' },
  { key: 'earnings', label: 'Earnings', icon: TrendingUp, gradient: 'bg-gradient-to-br from-pink-400 to-rose-500' },
  { key: 'referrals', label: 'Referrals', icon: Users, gradient: 'bg-gradient-to-br from-sky-400 to-blue-500' },
  { key: 'payouts', label: 'Payouts', icon: Wallet, gradient: 'bg-gradient-to-br from-violet-400 to-purple-600' },
  { key: 'settings', label: 'Settings', icon: Settings, gradient: 'bg-gradient-to-br from-slate-400 to-slate-600' },
];
const TAB_KEYS = TABS.map((t) => t.key);

function readHash() {
  if (typeof window === 'undefined') return 'overview';
  const h = window.location.hash.replace('#', '');
  return TAB_KEYS.includes(h) ? h : 'overview';
}

function Sidebar({ active, onSelect }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled && data?.user?.role === 'admin') setIsAdmin(true); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <aside className="w-full sm:w-64 shrink-0 p-3 sm:p-4 sticky top-0 z-30 sm:h-screen">
      <div className="glass rounded-3xl p-3 sm:p-4 flex flex-col gap-2 sm:h-full">
        <div className="flex items-center justify-between px-2 py-1 sm:mb-4">
          <BrandLogo size="sm" href="/" />
          <a href="/logout" aria-label="Log out" className="sm:hidden text-[var(--ink-faint)] p-1">
            <LogOut size={18} strokeWidth={1.75} />
          </a>
        </div>
        <nav aria-label="Dashboard" className="flex sm:flex-col gap-1 sm:gap-2 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
          {TABS.map(({ key, label, icon: Icon, gradient }) => (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-current={active === key ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-body font-medium transition-colors whitespace-nowrap shrink-0 text-left ${
                active === key ? 'bg-white/70 backdrop-blur-md text-[var(--ink)] border border-black' : 'text-[var(--ink-soft)] hover:bg-white/30'
              }`}
            >
              <span className={`w-7 h-7 rounded-lg ${gradient} flex items-center justify-center shrink-0`}>
                <Icon size={14} strokeWidth={2} className="text-white" />
              </span>
              {label}
            </button>
          ))}
          {isAdmin && (
            <a
              href="/admin/ads"
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-body font-medium whitespace-nowrap shrink-0 text-left text-[var(--ink-soft)] hover:bg-white/30"
            >
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shrink-0">
                <Shield size={14} strokeWidth={2} className="text-white" />
              </span>
              Admin
            </a>
          )}
        </nav>
        <a
          href="/logout"
          className="hidden sm:flex mt-auto items-center gap-3 px-3 py-2.5 text-sm font-body text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
        >
          <LogOut size={16} strokeWidth={1.75} /> Log out
        </a>
      </div>
    </aside>
  );
}

// ───────────────────────── account card ─────────────────────────
function AccountCard({ summary, loading, go, onCopyReferral }) {
  const available = num(summary?.availableBalance);
  const canPayout = available >= MIN_PAYOUT;
  const val = (v) => (loading ? <Skeleton className="h-6 w-14" /> : v);
  return (
    <div className="relative p-6 mb-6 overflow-hidden glass-strong" style={{ borderRadius: 40 }}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-200/60 via-sky-100/40 to-pink-100/50" />
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 opacity-25 blur-2xl -z-10" />

      <div className="flex items-start justify-between mb-5">
        <div className={`w-12 h-12 rounded-2xl ${BRAND_GRADIENT} flex items-center justify-center shadow-lg relative overflow-hidden`}>
          <div className="glass-shine" />
          <Wallet size={22} className="text-white relative z-10" />
        </div>
        <button
          type="button"
          onClick={() => go('settings')}
          aria-label="Open settings"
          className="w-9 h-9 rounded-full bg-white border border-black/10 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        >
          <Settings size={15} className="text-black" />
        </button>
      </div>

      <p className="font-display font-bold text-lg text-[var(--ink)] mb-0.5">Your account</p>
      <p className="font-body text-sm text-[var(--ink-soft)] mb-5">Publisher · Active</p>

      <div className="flex items-center gap-6 mb-6">
        <div>
          <p className="font-display font-bold text-lg text-[var(--ink)]">{val(money(summary?.availableBalance))}</p>
          <p className="text-xs font-body text-[var(--ink-faint)]">Available</p>
        </div>
        <div>
          <p className="font-display font-bold text-lg text-[var(--ink)]">{val(money(summary?.allTime?.avgCpm))}</p>
          <p className="text-xs font-body text-[var(--ink-faint)]">Avg. CPM</p>
        </div>
        <div>
          <p className="font-display font-bold text-lg text-[var(--ink)]">{val(money(summary?.referralEarnings))}</p>
          <p className="text-xs font-body text-[var(--ink-faint)]">Referral</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => go('payouts')} className="btn btn-primary font-body flex-1 px-5 py-2.5 rounded-full text-sm">
          Request payout
        </button>
        <button type="button" onClick={onCopyReferral} aria-label="Copy referral link" className="btn btn-secondary w-10 h-10 shrink-0 rounded-full">
          <Copy size={15} />
        </button>
      </div>
      {!loading && !canPayout && (
        <p className="text-xs font-body text-[var(--ink-faint)] mt-3">
          You need {money(MIN_PAYOUT)} to request a payout — {money(MIN_PAYOUT - available)} to go.
        </p>
      )}
    </div>
  );
}

// ───────────────────────── link creation ─────────────────────────
function normalizeUrl(raw) {
  const value = raw.trim();
  if (!value) return null;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const u = new URL(withProtocol);
    return u.hostname.includes('.') ? u.toString() : null;
  } catch {
    return null;
  }
}

function QuickShortener({ onCreated, toast }) {
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function shorten(e) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    const destinationUrl = normalizeUrl(url);
    if (!destinationUrl) { setError('Enter a valid link, e.g. https://example.com/page'); return; }
    const customAlias = alias.trim();
    if (customAlias && !/^[a-zA-Z0-9_-]{3,32}$/.test(customAlias)) {
      setError('Alias must be 3–32 characters: letters, numbers, - or _');
      return;
    }
    setBusy(true);
    try {
      const data = await api('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationUrl, customAlias: customAlias || undefined }),
      });
      setResult(data.shortUrl);
      setUrl('');
      setAlias('');
      toast('Link created');
      onCreated?.();
    } catch (err) {
      setError(err.message || 'Could not create the link. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    const ok = await copyText(result);
    toast(ok ? 'Link copied' : 'Could not copy', ok ? 'ok' : 'error');
  }

  return (
    <div className="glass rounded-3xl p-5 mb-6 font-shorten">
      <p className="text-sm font-semibold text-[var(--ink)] mb-3">Shorten a new link</p>
      <form onSubmit={shorten} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-long-destination-url.com/..."
            aria-label="Destination URL"
            className="flex-1 bg-white/50 border border-white/60 rounded-full px-5 py-2.5 text-base sm:text-sm font-shorten text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="custom-alias (optional)"
            aria-label="Custom alias"
            className="sm:w-56 bg-white/50 border border-white/60 rounded-full px-5 py-2.5 text-base sm:text-sm font-shorten text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}

        {result && !error && (
          <div className="flex items-center gap-2 bg-white/60 border border-white/70 rounded-full pl-5 pr-2 py-2 text-sm min-w-0">
            <a href={result} target="_blank" rel="noopener noreferrer" className="flex-1 underline truncate text-[var(--ink)] font-medium">
              {result}
            </a>
            <button type="button" onClick={copy} aria-label="Copy link" className="btn btn-secondary w-8 h-8 shrink-0 rounded-full">
              <Copy size={14} />
            </button>
          </div>
        )}

        <button type="submit" disabled={busy || !url.trim()} className="btn btn-shorten px-8 py-2.5 rounded-full text-sm self-stretch sm:self-start">
          {busy ? 'Creating…' : 'Shorten'}
        </button>
      </form>
    </div>
  );
}

// ───────────────────────── links list ─────────────────────────
function LinksList({ links, toast, emptyText = 'No links yet. Shorten one above to see it here.' }) {
  async function copy(l) {
    const ok = await copyText(shortUrlOf(l));
    toast(ok ? 'Short link copied' : 'Could not copy', ok ? 'ok' : 'error');
  }

  if (links.length === 0) return <EmptyState>{emptyText}</EmptyState>;

  return (
    <>
      {/* Phones: stacked cards */}
      <div className="sm:hidden flex flex-col gap-3">
        {links.map((l) => (
          <div key={l.id ?? linkCode(l)} className="glass rounded-3xl p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display font-semibold text-[var(--ink)] truncate">/{linkCode(l)}</p>
              <StatusBadge status={l.status} />
            </div>
            <p className="text-xs font-body text-[var(--ink-soft)] truncate mt-1">{l.destination_url}</p>
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm font-body text-[var(--ink)]">
                {fmtInt(l.total_views)} views · <span className="font-semibold">{money(l.total_earnings)}</span>
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => copy(l)} aria-label={`Copy /${linkCode(l)}`} className="btn btn-secondary w-9 h-9 rounded-full">
                  <Copy size={14} />
                </button>
                <a href={l.destination_url} target="_blank" rel="noopener noreferrer" aria-label="Open destination" className="btn btn-secondary w-9 h-9 rounded-full">
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Larger screens: table */}
      <div className="hidden sm:block glass rounded-3xl overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-white/40 text-left text-[var(--ink-faint)] text-xs">
              <th className="px-5 py-3 font-medium">Link</th>
              <th className="px-5 py-3 font-medium">Destination</th>
              <th className="px-5 py-3 font-medium text-right">Views</th>
              <th className="px-5 py-3 font-medium text-right">Earnings</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {links.map((l) => (
              <tr key={l.id ?? linkCode(l)} className="border-b border-white/30 last:border-0">
                <td className="px-5 py-3 font-display font-semibold text-[var(--ink)]">/{linkCode(l)}</td>
                <td className="px-5 py-3 text-[var(--ink-soft)] max-w-[16rem]">
                  <span className="block truncate" title={l.destination_url}>{l.destination_url}</span>
                </td>
                <td className="px-5 py-3 text-right text-[var(--ink)]">{fmtInt(l.total_views)}</td>
                <td className="px-5 py-3 text-right text-[var(--ink)]">{money(l.total_earnings)}</td>
                <td className="px-5 py-3"><StatusBadge status={l.status} /></td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => copy(l)} aria-label={`Copy /${linkCode(l)}`} className="btn btn-secondary w-8 h-8 rounded-full">
                      <Copy size={13} />
                    </button>
                    <a href={l.destination_url} target="_blank" rel="noopener noreferrer" aria-label="Open destination" className="btn btn-secondary w-8 h-8 rounded-full">
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ───────────────────────── chart ─────────────────────────
function TrendChart({ data, height = 220 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm font-body text-[var(--ink-faint)]" style={{ height }}>
        No earnings yet for this period.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="earnFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" tickFormatter={fmtDay} stroke="#1D1B2E60" fontSize={11} tickLine={false} axisLine={false} minTickGap={18} />
        <YAxis stroke="#1D1B2E60" fontSize={11} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `$${v}`} />
        <Tooltip
          labelFormatter={fmtDay}
          formatter={(v) => [money(v), 'Earnings']}
          contentStyle={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 12, fontSize: 12 }}
        />
        <Area type="monotone" dataKey="earnings" stroke="#8B5CF6" strokeWidth={3} fill="url(#earnFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const cleanTrend = (data) => (Array.isArray(data) ? data.map((d) => ({ ...d, earnings: num(d.earnings) })) : []);

// ───────────────────────── views ─────────────────────────
function RefreshButton({ onClick, spinning }) {
  return (
    <button type="button" onClick={onClick} aria-label="Refresh" className="btn btn-secondary w-10 h-10 shrink-0 rounded-full">
      <RefreshCw size={15} className={spinning ? 'animate-spin' : ''} />
    </button>
  );
}

function OverviewView({ summaryQ, linksQ, go, toast, onCopyReferral, refreshAll }) {
  const summary = summaryQ.data && !summaryQ.data.error ? summaryQ.data : null;
  const trendQ = useFetch('/api/dashboard/earnings-trend?days=14');
  const trend = useMemo(() => cleanTrend(trendQ.data), [trendQ.data]);
  const links = Array.isArray(linksQ.data) ? linksQ.data : [];
  const loading = summaryQ.loading && !summary;

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Your earnings and links at a glance."
        action={<RefreshButton onClick={() => { refreshAll(); trendQ.reload(); }} spinning={summaryQ.loading || linksQ.loading} />}
      />
      {summaryQ.error && <ErrorNote message="Couldn't load your stats." onRetry={summaryQ.reload} />}

      <AccountCard summary={summary} loading={loading} go={go} onCopyReferral={onCopyReferral} />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <StatCard loading={loading} label="Today's earnings" value={money(summary?.today?.earnings)}
          sublabel={`${fmtInt(summary?.today?.views)} views`} gradient="bg-indigo-500" />
        <StatCard loading={loading} label="All-time earnings" value={money(summary?.allTime?.earnings)} gradient="bg-pink-500" />
        <StatCard loading={loading} label="Average CPM" value={money(summary?.allTime?.avgCpm)} gradient="bg-sky-400" />
        <StatCard loading={loading} label="Referral income" value={money(summary?.referralEarnings)} gradient="bg-violet-500" />
        <StatCard loading={loading} label="Available balance" value={money(summary?.availableBalance)}
          sublabel={`Min. payout ${money(MIN_PAYOUT)}`} gradient="bg-emerald-500" />
      </div>

      <QuickShortener toast={toast} onCreated={linksQ.reload} />

      <div className="glass rounded-3xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-body font-semibold text-[var(--ink)]">Earnings, last 14 days</p>
          <button type="button" onClick={() => go('earnings')} className="text-xs font-body font-medium text-indigo-600 hover:underline">
            Details
          </button>
        </div>
        {trendQ.loading && trend.length === 0 ? <Skeleton className="h-[200px] w-full" /> : <TrendChart data={trend} height={200} />}
      </div>

      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-sm font-body font-semibold text-[var(--ink)]">Recent links</p>
        <button type="button" onClick={() => go('links')} className="text-xs font-body font-medium text-indigo-600 hover:underline">
          View all
        </button>
      </div>
      {linksQ.error ? (
        <ErrorNote message="Couldn't load your links." onRetry={linksQ.reload} />
      ) : linksQ.loading && links.length === 0 ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <LinksList links={links.slice(0, 5)} toast={toast} />
      )}
    </>
  );
}

function LinksView({ linksQ, toast }) {
  const links = Array.isArray(linksQ.data) ? linksQ.data : [];
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('recent');
  const [shown, setShown] = useState(PAGE_SIZE);

  const statuses = useMemo(() => ['all', ...new Set(links.map((l) => String(l.status || 'unknown').toLowerCase()))], [links]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = links.filter((l) => {
      const st = String(l.status || 'unknown').toLowerCase();
      if (status !== 'all' && st !== status) return false;
      if (!q) return true;
      return `${linkCode(l)} ${l.destination_url || ''}`.toLowerCase().includes(q);
    });
    if (sort === 'views') out = [...out].sort((a, b) => num(b.total_views) - num(a.total_views));
    else if (sort === 'earnings') out = [...out].sort((a, b) => num(b.total_earnings) - num(a.total_earnings));
    return out;
  }, [links, query, status, sort]);

  useEffect(() => { setShown(PAGE_SIZE); }, [query, status, sort]);

  return (
    <>
      <PageHeader
        title="Links"
        subtitle={`${links.length} link${links.length === 1 ? '' : 's'} in total`}
        action={<RefreshButton onClick={linksQ.reload} spinning={linksQ.loading} />}
      />
      <QuickShortener toast={toast} onCreated={linksQ.reload} />

      {links.length > 0 && (
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by alias or destination"
                aria-label="Search links"
                className={`${INPUT} pl-10`}
              />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort links" className={`${INPUT} sm:w-48`}>
              <option value="recent">Sort: Recent</option>
              <option value="views">Sort: Most views</option>
              <option value="earnings">Sort: Most earnings</option>
            </select>
          </div>
          {statuses.length > 2 && (
            <Chips
              label="Filter by status"
              value={status}
              onChange={setStatus}
              options={statuses.map((s) => ({ value: s, label: s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1) }))}
            />
          )}
        </div>
      )}

      {linksQ.error && <ErrorNote message="Couldn't load your links." onRetry={linksQ.reload} />}
      {linksQ.loading && links.length === 0 ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <>
          <LinksList
            links={filtered.slice(0, shown)}
            toast={toast}
            emptyText={links.length === 0 ? 'No links yet. Shorten one above to see it here.' : 'No links match your search.'}
          />
          {filtered.length > shown && (
            <div className="flex justify-center mt-4">
              <button type="button" onClick={() => setShown((n) => n + PAGE_SIZE)} className="btn btn-secondary px-5 py-2 rounded-full text-sm font-body">
                Show more ({filtered.length - shown} left)
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function EarningsView({ summary, loading }) {
  const [days, setDays] = useState(14);
  const trendQ = useFetch(`/api/dashboard/earnings-trend?days=${days}`);
  const trend = useMemo(() => cleanTrend(trendQ.data), [trendQ.data]);

  const total = trend.reduce((s, d) => s + d.earnings, 0);
  const avg = trend.length ? total / trend.length : 0;
  const best = trend.reduce((b, d) => (d.earnings > (b?.earnings ?? -1) ? d : b), null);
  const hasViews = trend.some((d) => d.views != null);

  return (
    <>
      <PageHeader
        title="Earnings"
        subtitle="How your links are paying out over time."
        action={<RefreshButton onClick={trendQ.reload} spinning={trendQ.loading} />}
      />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard loading={trendQ.loading && trend.length === 0} label={`Last ${days} days`} value={money(total)} gradient="bg-indigo-500" />
        <StatCard loading={trendQ.loading && trend.length === 0} label="Daily average" value={money(avg)} gradient="bg-pink-500" />
        <StatCard loading={trendQ.loading && trend.length === 0} label="Best day" value={best ? money(best.earnings) : '—'}
          sublabel={best ? fmtDay(best.day) : undefined} gradient="bg-sky-400" />
        <StatCard loading={loading} label="All-time" value={money(summary?.allTime?.earnings)} gradient="bg-violet-500" />
      </div>

      <div className="glass rounded-3xl p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p className="text-sm font-body font-semibold text-[var(--ink)]">Daily earnings</p>
          <Chips
            label="Range"
            value={days}
            onChange={setDays}
            options={[{ value: 7, label: '7 days' }, { value: 14, label: '14 days' }, { value: 30, label: '30 days' }]}
          />
        </div>
        {trendQ.error && <ErrorNote message="Couldn't load earnings." onRetry={trendQ.reload} />}
        {trendQ.loading && trend.length === 0 ? <Skeleton className="h-[220px] w-full" /> : <TrendChart data={trend} />}
      </div>

      {trend.length > 0 && (
        <div className="glass rounded-3xl overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-white/40 text-left text-[var(--ink-faint)] text-xs">
                <th className="px-5 py-3 font-medium">Day</th>
                {hasViews && <th className="px-5 py-3 font-medium text-right">Views</th>}
                <th className="px-5 py-3 font-medium text-right">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {[...trend].reverse().map((d, i) => (
                <tr key={`${d.day}-${i}`} className="border-b border-white/30 last:border-0">
                  <td className="px-5 py-3 text-[var(--ink)]">{fmtDate(d.day)}</td>
                  {hasViews && <td className="px-5 py-3 text-right text-[var(--ink-soft)]">{fmtInt(d.views)}</td>}
                  <td className="px-5 py-3 text-right font-semibold text-[var(--ink)]">{money(d.earnings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function ReferralsView({ referral, summary, loading, toast }) {
  const { url, count, list, error, loading: refLoading } = referral;

  async function copy() {
    if (!url) return;
    const ok = await copyText(url);
    toast(ok ? 'Referral link copied' : 'Could not copy', ok ? 'ok' : 'error');
  }
  async function share() {
    if (!url) return;
    if (navigator.share) {
      try { await navigator.share({ title: 'Bexalink', text: 'Shorten links and get paid for every view.', url }); } catch { /* dismissed */ }
    } else {
      copy();
    }
  }

  return (
    <>
      <PageHeader title="Referrals" subtitle="Earn 10% of what publishers you refer make, for life." />

      <div className="relative p-6 mb-6 overflow-hidden glass-strong" style={{ borderRadius: 40 }}>
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-200/60 via-indigo-100/40 to-pink-100/50" />
        <p className="font-display font-bold text-lg text-[var(--ink)] mb-1">Your referral link</p>
        <p className="font-body text-sm text-[var(--ink-soft)] mb-4">Share it anywhere. Anyone who signs up through it is linked to you.</p>
        {url ? (
          <>
            <div className="flex items-center gap-2 bg-white/70 border border-white/80 rounded-full pl-5 pr-2 py-2 mb-3 min-w-0">
              <span className="flex-1 truncate text-sm font-body text-[var(--ink)]">{url}</span>
              <button type="button" onClick={copy} aria-label="Copy referral link" className="btn btn-secondary w-9 h-9 shrink-0 rounded-full">
                <Copy size={14} />
              </button>
            </div>
            <button type="button" onClick={share} className="btn btn-primary font-body px-5 py-2.5 rounded-full text-sm">
              <Share2 size={14} /> Share
            </button>
          </>
        ) : refLoading ? (
          <Skeleton className="h-11 w-full" />
        ) : (
          <p className="text-sm font-body text-[var(--ink-soft)]">
            {error ? "Your referral link isn't available yet." : 'Your referral link will appear here once it is enabled on your account.'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 max-w-md">
        <StatCard loading={loading} label="Referral income" value={money(summary?.referralEarnings)} gradient="bg-violet-500" />
        <StatCard loading={refLoading} label="Publishers referred" value={count != null ? fmtInt(count) : '—'} gradient="bg-sky-400" />
      </div>

      {list.length > 0 && (
        <div className="glass rounded-3xl overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-white/40 text-left text-[var(--ink-faint)] text-xs">
                <th className="px-5 py-3 font-medium">Publisher</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium text-right">You earned</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r, i) => (
                <tr key={r.id ?? i} className="border-b border-white/30 last:border-0">
                  <td className="px-5 py-3 text-[var(--ink)]">{r.name || r.username || r.email || `Publisher ${i + 1}`}</td>
                  <td className="px-5 py-3 text-[var(--ink-soft)]">{fmtDate(r.joined_at || r.created_at)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-[var(--ink)]">{money(r.earnings ?? r.earned)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ── Payouts ──
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const PAYOUT_METHODS = [
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

function PayoutsView({ summary, loading, payoutsQ, reloadSummary, toast }) {
  const available = num(summary?.availableBalance);
  const [method, setMethod] = useState('paypal');
  const [network, setNetwork] = useState('TRC20');
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Pre-fill from what was saved on this device.
  useEffect(() => {
    const p = loadPrefs();
    if (PAYOUT_METHODS.some((m) => m.key === p.method)) {
      setMethod(p.method);
      if (p.network) setNetwork(p.network);
      if (p.account) setAccount(p.account);
    }
  }, []);

  const cfg = PAYOUT_METHODS.find((m) => m.key === method);
  const history = Array.isArray(payoutsQ.data) ? payoutsQ.data : Array.isArray(payoutsQ.data?.payouts) ? payoutsQ.data.payouts : [];
  const progress = Math.min(100, (available / MIN_PAYOUT) * 100);

  function changeMethod(key) {
    setMethod(key);
    setError(null);
    const p = loadPrefs();
    setAccount(p.method === key && p.account ? p.account : '');
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    const amt = Number(amount);
    const acct = account.trim();
    if (!Number.isFinite(amt) || amt <= 0) return setError('Enter the amount you want to withdraw.');
    if (amt < MIN_PAYOUT) return setError(`The minimum payout is ${money(MIN_PAYOUT)}.`);
    if (amt > available + 0.0001) return setError(`You only have ${money(available)} available.`);
    if (Math.round(amt * 100) / 100 !== amt) return setError('Use at most two decimal places.');
    const verdict = cfg.check(acct, network);
    if (verdict !== true) return setError(verdict);

    setBusy(true);
    try {
      await api('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, method, account: acct, ...(cfg.networks ? { network } : {}) }),
      });
      if (remember && !cfg.sensitive) savePrefs({ method, network, account: acct });
      setAmount('');
      toast('Payout requested');
      reloadSummary();
      payoutsQ.reload();
    } catch (err) {
      setError(err.status === 404 ? "Payout requests aren't enabled on the server yet." : err.message || 'Could not request the payout.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Payouts" subtitle="Withdraw your balance to the account you already use." />

      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-4 sm:gap-6 items-start mb-6">
        <div className="relative p-6 overflow-hidden glass-strong" style={{ borderRadius: 40 }}>
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-200/60 via-sky-100/40 to-pink-100/50" />
          <p className="text-xs font-body font-medium text-[var(--ink-faint)] mb-1">Available balance</p>
          <p className="font-display font-bold text-4xl text-[var(--ink)] mb-4">
            {loading ? <Skeleton className="h-10 w-32" /> : money(available)}
          </p>
          <div className="h-2 rounded-full bg-white/70 overflow-hidden mb-2" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to minimum payout">
            <div className={`h-full rounded-full ${BRAND_GRADIENT}`} style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs font-body text-[var(--ink-soft)]">
            {available >= MIN_PAYOUT ? 'You can request a payout now.' : `${money(MIN_PAYOUT - available)} more to reach the ${money(MIN_PAYOUT)} minimum.`}
          </p>
        </div>

        <form onSubmit={submit} className="glass rounded-3xl p-5 flex flex-col gap-4">
          <p className="text-sm font-body font-semibold text-[var(--ink)]">Request a payout</p>

          <div>
            <p className="text-xs font-body font-medium text-[var(--ink-faint)] mb-2">Method</p>
            <Chips label="Payout method" value={method} onChange={changeMethod} options={PAYOUT_METHODS.map((m) => ({ value: m.key, label: m.label }))} />
          </div>

          {cfg.networks && (
            <div>
              <p className="text-xs font-body font-medium text-[var(--ink-faint)] mb-2">Network</p>
              <Chips label="USDT network" value={network} onChange={(n) => { setNetwork(n); setError(null); }} options={cfg.networks.map((n) => ({ value: n, label: n }))} />
            </div>
          )}

          <label className="block">
            <span className="block text-xs font-body font-medium text-[var(--ink-faint)] mb-2">{cfg.field}</span>
            {cfg.multiline ? (
              <textarea value={account} onChange={(e) => setAccount(e.target.value)} rows={3} placeholder={cfg.placeholder} className={`${INPUT} resize-none`} />
            ) : (
              <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder={cfg.placeholder}
                type={cfg.key === 'paypal' || cfg.key === 'payoneer' ? 'email' : 'text'} autoComplete="off" spellCheck={false} className={INPUT} />
            )}
          </label>

          <label className="block">
            <span className="block text-xs font-body font-medium text-[var(--ink-faint)] mb-2">Amount (USD)</span>
            <div className="flex gap-2">
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder={`Min. ${MIN_PAYOUT}.00`} className={INPUT} />
              <button type="button" onClick={() => setAmount(available > 0 ? available.toFixed(2) : '')} disabled={available <= 0}
                className="btn btn-secondary px-4 rounded-2xl text-xs font-body shrink-0">
                Max
              </button>
            </div>
          </label>

          {!cfg.sensitive && (
            <label className="flex items-center gap-2 text-xs font-body text-[var(--ink-soft)] cursor-pointer">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-indigo-500" />
              Remember these details on this device
            </label>
          )}

          {error && <p role="alert" className="text-sm font-body text-rose-600">{error}</p>}

          <button type="submit" disabled={busy || loading || available < MIN_PAYOUT} className="btn btn-primary font-body px-6 py-3 rounded-full text-sm">
            {busy ? 'Requesting…' : 'Request payout'}
          </button>
        </form>
      </div>

      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-sm font-body font-semibold text-[var(--ink)]">Payout history</p>
        <RefreshButton onClick={payoutsQ.reload} spinning={payoutsQ.loading} />
      </div>
      {payoutsQ.error && history.length === 0 ? (
        <ErrorNote message="Payout history isn't available right now." onRetry={payoutsQ.reload} />
      ) : payoutsQ.loading && history.length === 0 ? (
        <Skeleton className="h-24 w-full" />
      ) : history.length === 0 ? (
        <EmptyState>No payouts yet. Your requests will show up here.</EmptyState>
      ) : (
        <div className="glass rounded-3xl overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm font-body">
            <thead>
              <tr className="border-b border-white/40 text-left text-[var(--ink-faint)] text-xs">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((p, i) => (
                <tr key={p.id ?? i} className="border-b border-white/30 last:border-0">
                  <td className="px-5 py-3 text-[var(--ink)]">{fmtDate(p.created_at || p.createdAt)}</td>
                  <td className="px-5 py-3 text-[var(--ink-soft)] capitalize">{PAYOUT_METHODS.find((m) => m.key === p.method)?.label || p.method}</td>
                  <td className="px-5 py-3 text-right font-semibold text-[var(--ink)]">{money(p.amount)}</td>
                  <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function SettingsView({ summary, toast }) {
  const [prefs, setPrefs] = useState({});
  useEffect(() => { setPrefs(loadPrefs()); }, []);
  const saved = PAYOUT_METHODS.find((m) => m.key === prefs.method);
  const identity = summary?.email || summary?.username || summary?.name;

  function clearPrefs() {
    savePrefs({});
    setPrefs({});
    toast('Saved payout details removed');
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Your account and this device." />

      <div className="glass rounded-3xl p-5 mb-4 max-w-xl">
        <p className="text-sm font-body font-semibold text-[var(--ink)] mb-1">Account</p>
        <p className="text-sm font-body text-[var(--ink-soft)] mb-4">{identity ? `Signed in as ${identity}.` : 'You are signed in.'}</p>
        <a href="/logout" className="btn btn-secondary font-body px-5 py-2.5 rounded-full text-sm">
          <LogOut size={14} /> Log out
        </a>
      </div>

      <div className="glass rounded-3xl p-5 max-w-xl">
        <p className="text-sm font-body font-semibold text-[var(--ink)] mb-1">Saved payout details</p>
        <p className="text-sm font-body text-[var(--ink-soft)] mb-4">
          Stored only in this browser to pre-fill the payout form. Bank details are never saved.
        </p>
        {saved && prefs.account ? (
          <div className="flex items-center justify-between gap-3 bg-white/60 rounded-2xl px-4 py-3 mb-4">
            <div className="min-w-0">
              <p className="text-xs font-body text-[var(--ink-faint)]">{saved.label}{prefs.method === 'usdt' && prefs.network ? ` · ${prefs.network}` : ''}</p>
              <p className="text-sm font-body text-[var(--ink)] truncate">{prefs.account}</p>
            </div>
            <button type="button" onClick={clearPrefs} className="btn btn-secondary px-4 py-2 rounded-full text-xs font-body shrink-0">Remove</button>
          </div>
        ) : (
          <p className="text-sm font-body text-[var(--ink-faint)]">Nothing saved yet.</p>
        )}
      </div>
    </>
  );
}

// Shown when the API says the visitor isn't logged in (HTTP 401), instead of
// silently bouncing them to another URL.
function SignedOut() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="relative w-full max-w-sm p-7 overflow-hidden glass-strong text-center" style={{ borderRadius: 40 }}>
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-200/60 via-sky-100/40 to-pink-100/50" />
        <div className="flex justify-center mb-5"><BrandLogo href="/" /></div>
        <div className="w-16 h-16 mx-auto mb-2 rounded-2xl overflow-hidden flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Bexa Network" className="w-full h-full object-contain" />
        </div>
        <p className="text-[11px] font-body tracking-wide uppercase text-[var(--ink-faint)] mb-4">
          Powered by Bexa Network
        </p>
        <h1 className="font-display font-bold text-2xl text-[var(--ink)] mb-1">You're signed out</h1>
        <p className="font-body text-sm text-[var(--ink-soft)] mb-6">Log in to see your earnings, links and payouts.</p>
        <div className="flex gap-2 mb-4">
          <a href="/login" className="btn btn-primary font-body flex-1 px-5 py-2.5 rounded-full text-sm">Log in</a>
          <a href="/signup" className="btn btn-secondary font-body flex-1 px-5 py-2.5 rounded-full text-sm">Sign up</a>
        </div>
        <a href="/" className="text-xs font-body text-[var(--ink-faint)] hover:text-[var(--ink-soft)]">Back to home</a>
      </div>
    </div>
  );
}

// ───────────────────────── root ─────────────────────────
export default function Dashboard() {
  const [tab, setTab] = useState('overview');
  const [toast, showToast] = useToast();

  const summaryQ = useFetch('/api/dashboard/summary');
  const linksQ = useFetch('/api/dashboard/links');
  const payoutsQ = useFetch('/api/payouts');
  const referralsQ = useFetch('/api/dashboard/referrals');

  const summary = summaryQ.data && !summaryQ.data.error ? summaryQ.data : null;
  const signedOut = [summaryQ, linksQ, payoutsQ].some((q) => q.error?.status === 401);

  // Keep the active section in the URL hash (#payouts) so refresh / links work.
  useEffect(() => {
    setTab(readHash());
    const onHash = () => setTab(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = useCallback((key) => {
    setTab(key);
    window.history.replaceState(window.history.state, '', `#${key}`);
    window.scrollTo(0, 0);
  }, []);

  // Referral link: from the endpoint if present, else built from a code on the summary.
  const referral = useMemo(() => {
    const d = referralsQ.data && !referralsQ.data.error ? referralsQ.data : {};
    const code = d.referralCode || d.code || summary?.referralCode;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = d.referralUrl || (code ? `${origin}/signup?ref=${encodeURIComponent(code)}` : null);
    const list = Array.isArray(d.referrals) ? d.referrals : [];
    const count = d.count ?? d.total ?? (list.length || null);
    return { url, count, list, error: referralsQ.error, loading: referralsQ.loading && !url };
  }, [referralsQ.data, referralsQ.error, referralsQ.loading, summary]);

  const copyReferral = useCallback(async () => {
    if (!referral.url) { go('referrals'); return; }
    const ok = await copyText(referral.url);
    showToast(ok ? 'Referral link copied' : 'Could not copy', ok ? 'ok' : 'error');
  }, [referral.url, go, showToast]);

  const refreshAll = useCallback(() => { summaryQ.reload(); linksQ.reload(); }, [summaryQ.reload, linksQ.reload]);
  const loadingSummary = summaryQ.loading && !summary;

  if (signedOut) return <SignedOut />;

  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      <Sidebar active={tab} onSelect={go} />

      <main className="flex-1 min-w-0 px-3 sm:px-4 py-3 sm:py-4 max-w-6xl w-full pb-24">
        {tab === 'overview' && (
          <OverviewView summaryQ={summaryQ} linksQ={linksQ} go={go} toast={showToast} onCopyReferral={copyReferral} refreshAll={refreshAll} />
        )}
        {tab === 'links' && <LinksView linksQ={linksQ} toast={showToast} />}
        {tab === 'earnings' && <EarningsView summary={summary} loading={loadingSummary} />}
        {tab === 'referrals' && <ReferralsView referral={referral} summary={summary} loading={loadingSummary} toast={showToast} />}
        {tab === 'payouts' && (
          <PayoutsView summary={summary} loading={loadingSummary} payoutsQ={payoutsQ} reloadSummary={summaryQ.reload} toast={showToast} />
        )}
        {tab === 'settings' && <SettingsView summary={summary} toast={showToast} />}
      </main>

      <Toast toast={toast} />
    </div>
  );
}
