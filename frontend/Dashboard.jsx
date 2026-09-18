'use client';
// Dashboard.jsx
// Publisher dashboard for Bexalink — matches LandingPage.jsx's Liquid Glass
// design: frosted glass panels over the gradient-blob backdrop defined in
// app/globals.css, gradient icon badges, and bold rounded type instead of
// the earlier ledger/serif treatment.

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link2, Wallet, Users, TrendingUp, Copy, Settings, LogOut } from 'lucide-react';
import BrandLogo from './BrandLogo';

const BRAND_GRADIENT = 'bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500';

function StatCard({ label, value, sublabel, gradient }) {
  return (
    <div className="glass rounded-2xl p-4 sm:p-5 relative overflow-hidden">
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${gradient} opacity-25 blur-2xl`} />
      <p className="text-xs font-body font-medium text-[var(--ink-faint)] mb-1.5 relative z-10">{label}</p>
      <p className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)] relative z-10">{value}</p>
      {sublabel && <p className="text-xs font-body text-[var(--ink-faint)] mt-1 relative z-10">{sublabel}</p>}
    </div>
  );
}

// A rounded, soft-gradient profile-style summary card — same treatment as
// the account card on the landing page's closing section, so the dashboard
// opens with the same signature shape before dropping into the plain
// stat grid and table below.
function AccountCard({ summary }) {
  return (
    <div className="relative p-6 mb-6 overflow-hidden glass-strong" style={{ borderRadius: 40 }}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-200/60 via-sky-100/40 to-pink-100/50" />
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 opacity-25 blur-2xl -z-10" />

      <div className="flex items-start justify-between mb-5">
        <div className={`w-12 h-12 rounded-2xl ${BRAND_GRADIENT} flex items-center justify-center shadow-lg relative overflow-hidden`}>
          <div className="glass-shine" />
          <Wallet size={22} className="text-white relative z-10" />
        </div>
        <span className="w-9 h-9 rounded-full bg-white border border-black/10 flex items-center justify-center">
          <Settings size={15} className="text-black" />
        </span>
      </div>

      <p className="font-display font-bold text-lg text-[var(--ink)] mb-0.5">Your account</p>
      <p className="font-body text-sm text-[var(--ink-soft)] mb-5">Publisher · Active</p>

      <div className="flex items-center gap-6 mb-6">
        <div>
          <p className="font-display font-bold text-lg text-[var(--ink)]">
            {summary ? `$${summary.availableBalance.toFixed(2)}` : '—'}
          </p>
          <p className="text-xs font-body text-[var(--ink-faint)]">Available</p>
        </div>
        <div>
          <p className="font-display font-bold text-lg text-[var(--ink)]">
            {summary ? `$${summary.allTime.avgCpm.toFixed(2)}` : '—'}
          </p>
          <p className="text-xs font-body text-[var(--ink-faint)]">Avg. CPM</p>
        </div>
        <div>
          <p className="font-display font-bold text-lg text-[var(--ink)]">
            {summary ? `$${summary.referralEarnings.toFixed(2)}` : '—'}
          </p>
          <p className="text-xs font-body text-[var(--ink-faint)]">Referral</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn btn-primary font-body flex-1 px-5 py-2.5 rounded-full text-sm">
          Request payout
        </button>
        <button aria-label="Copy" className="btn btn-secondary w-10 h-10 shrink-0 rounded-full">
          <Copy size={15} />
        </button>
      </div>
    </div>
  );
}

function Sidebar({ active }) {
  const items = [
    { key: 'links', label: 'Links', icon: Link2, gradient: 'bg-gradient-to-br from-indigo-400 to-indigo-600' },
    { key: 'earnings', label: 'Earnings', icon: TrendingUp, gradient: 'bg-gradient-to-br from-pink-400 to-rose-500' },
    { key: 'referrals', label: 'Referrals', icon: Users, gradient: 'bg-gradient-to-br from-sky-400 to-blue-500' },
    { key: 'payouts', label: 'Payouts', icon: Wallet, gradient: 'bg-gradient-to-br from-violet-400 to-purple-600' },
    { key: 'settings', label: 'Settings', icon: Settings, gradient: 'bg-gradient-to-br from-slate-400 to-slate-600' },
  ];
  return (
    <aside className="w-full sm:w-64 shrink-0 p-3 sm:p-4">
      <div className="glass rounded-3xl p-4 flex sm:flex-col gap-1 sm:gap-2 h-full overflow-x-auto sm:overflow-visible">
        <div className="mb-2 sm:mb-6 px-2 py-1 hidden sm:block">
          <BrandLogo size="sm" href="/dashboard/links" />
        </div>
        {items.map(({ key, label, icon: Icon, gradient }) => (
          <a key={key} href={`/dashboard/${key}`}
             className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-body font-medium transition-colors whitespace-nowrap shrink-0
               ${active === key ? 'glass-strong text-[var(--ink)]' : 'text-[var(--ink-soft)] hover:bg-white/30'}`}>
            <span className={`w-7 h-7 rounded-lg ${gradient} flex items-center justify-center shrink-0`}>
              <Icon size={14} strokeWidth={2} className="text-white" />
            </span>
            {label}
          </a>
        ))}
        <a href="/logout" className="hidden sm:flex mt-auto items-center gap-3 px-3 py-2.5 text-sm font-body text-[var(--ink-faint)] hover:text-[var(--ink-soft)]">
          <LogOut size={16} strokeWidth={1.75} /> Log out
        </a>
      </div>
    </aside>
  );
}

function QuickShortener() {
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function shorten() {
    if (!url) return;
    setBusy(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationUrl: url, customAlias: alias || undefined }),
      });
      const data = await res.json();
      if (res.ok) setResult(data.shortUrl); else setResult(`Error: ${data.error}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass rounded-3xl p-5 mb-6 font-shorten">
      <p className="text-sm font-semibold text-[var(--ink)] mb-3">Shorten a new link</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-long-destination-url.com/..."
          className="flex-1 bg-white/50 border border-white/60 rounded-full px-5 py-2.5 text-sm font-shorten
                     text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <input value={alias} onChange={(e) => setAlias(e.target.value)}
          placeholder="custom-alias (optional)"
          className="sm:w-56 bg-white/50 border border-white/60 rounded-full px-5 py-2.5 text-sm font-shorten
                     text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <button onClick={shorten} disabled={busy}
          className="btn btn-shorten px-8 py-2.5 rounded-full text-sm">
          {busy ? 'Creating…' : 'Shorten'}
        </button>
      </div>
      {result && (
        <div className="mt-3 flex items-center gap-2 text-sm text-[var(--ink-soft)]">
          <span>{result}</span>
          <button onClick={() => navigator.clipboard.writeText(result)} aria-label="Copy link" className="btn btn-secondary w-8 h-8 shrink-0 rounded-full">
            <Copy size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function LinksTable({ links }) {
  if (links.length === 0) {
    return (
      <div className="glass rounded-3xl px-5 py-10 text-center">
        <p className="text-sm font-body text-[var(--ink-faint)]">No links yet. Shorten one above to see it here.</p>
      </div>
    );
  }
  return (
    <div className="glass rounded-3xl overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm font-body">
        <thead>
          <tr className="border-b border-white/40 text-left text-[var(--ink-faint)] text-xs">
            <th className="px-5 py-3 font-medium">Link</th>
            <th className="px-5 py-3 font-medium">Destination</th>
            <th className="px-5 py-3 font-medium text-right">Views</th>
            <th className="px-5 py-3 font-medium text-right">Earnings</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {links.map((l) => (
            <tr key={l.id} className="border-b border-white/30 last:border-0">
              <td className="px-5 py-3 font-display font-semibold text-[var(--ink)]">/{l.short_code || l.custom_alias}</td>
              <td className="px-5 py-3 text-[var(--ink-soft)] truncate max-w-xs">{l.destination_url}</td>
              <td className="px-5 py-3 text-right text-[var(--ink)]">{l.total_views.toLocaleString()}</td>
              <td className="px-5 py-3 text-right text-[var(--ink)]">${l.total_earnings.toFixed(2)}</td>
              <td className="px-5 py-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-body font-medium ${
                  l.status === 'active' ? 'bg-emerald-500/15 text-emerald-700'
                  : l.status === 'blocked' ? 'bg-rose-500/15 text-rose-700'
                  : 'bg-slate-500/10 text-slate-500'}`}>
                  {l.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [links, setLinks] = useState([]);
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((r) => r.json())
      .then((data) => { if (data && !data.error) setSummary(data); })
      .catch(() => {});
    fetch('/api/dashboard/links')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setLinks(data); })
      .catch(() => setLinks([]));
    fetch('/api/dashboard/earnings-trend?days=14')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setTrend(data); })
      .catch(() => setTrend([]));
  }, []);

  return (
    <div className="min-h-screen flex flex-col sm:flex-row">
      <Sidebar active="links" />

      <main className="flex-1 px-3 sm:px-4 py-3 sm:py-4 max-w-6xl w-full overflow-x-hidden">
        <h1 className="font-display font-bold text-xl text-[var(--ink)] mb-5 px-1">Overview</h1>

        <AccountCard summary={summary} />

        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-6">
            <StatCard label="Today's earnings" value={`$${summary.today.earnings.toFixed(2)}`}
              sublabel={`${summary.today.views.toLocaleString()} views`} gradient="bg-indigo-500" />
            <StatCard label="All-time earnings" value={`$${summary.allTime.earnings.toFixed(2)}`} gradient="bg-pink-500" />
            <StatCard label="Average CPM" value={`$${summary.allTime.avgCpm.toFixed(2)}`} gradient="bg-sky-400" />
            <StatCard label="Referral income" value={`$${summary.referralEarnings.toFixed(2)}`} gradient="bg-violet-500" />
            <StatCard label="Available balance" value={`$${summary.availableBalance.toFixed(2)}`}
              sublabel="Min. payout $5" gradient="bg-emerald-500" />
          </div>
        )}

        <QuickShortener />

        {trend.length > 0 && (
          <div className="glass rounded-3xl p-5 mb-6 h-64">
            <p className="text-sm font-body font-semibold text-[var(--ink)] mb-3">Earnings, last 14 days</p>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={trend}>
                <XAxis dataKey="day" stroke="#1D1B2E60" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#1D1B2E60" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="earnings" stroke="#8B5CF6" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <p className="text-sm font-body font-semibold text-[var(--ink)] mb-3 px-1">Your links</p>
        <LinksTable links={links} />
      </main>
    </div>
  );
}
