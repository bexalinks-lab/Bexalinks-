'use client';
// Dashboard.jsx
// Publisher dashboard for Bexalink — Next.js + Tailwind.
// Design language: near-black charcoal surface, hairline dividers instead of
// card shadows, and the brand's cream -> peach -> pink gradient reserved for
// exactly one hero stat and the wordmark, so it reads as a deliberate accent
// rather than decoration repeated on every element.

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link2, Wallet, Users, TrendingUp, Copy, Settings, LogOut } from 'lucide-react';

const BRAND_GRADIENT = 'bg-gradient-to-r from-[#F7E9B9] via-[#F6C9A0] to-[#F6A8E0]';

function StatLine({ label, value, sublabel, accent = false }) {
  return (
    <div className="flex-1 py-5 px-6 border-r border-white/10 last:border-r-0">
      <p className="text-xs uppercase tracking-wide text-white/40 mb-2">{label}</p>
      <p className={accent
        ? `text-3xl font-semibold ${BRAND_GRADIENT} bg-clip-text text-transparent`
        : 'text-3xl font-semibold text-white'}>
        {value}
      </p>
      {sublabel && <p className="text-xs text-white/35 mt-1">{sublabel}</p>}
    </div>
  );
}

function Sidebar({ active }) {
  const items = [
    { key: 'links', label: 'Links', icon: Link2 },
    { key: 'earnings', label: 'Earnings', icon: TrendingUp },
    { key: 'referrals', label: 'Referrals', icon: Users },
    { key: 'payouts', label: 'Payouts', icon: Wallet },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];
  return (
    <aside className="w-56 shrink-0 border-r border-white/10 flex flex-col py-6 px-4">
      <div className="mb-10 px-2">
        <span className={`text-2xl font-serif italic ${BRAND_GRADIENT} bg-clip-text text-transparent`}>
          Bexalink
        </span>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ key, label, icon: Icon }) => (
          <a key={key} href={`/dashboard/${key}`}
             className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
               ${active === key ? 'bg-white/[0.06] text-white' : 'text-white/50 hover:text-white/80'}`}>
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </a>
        ))}
      </nav>
      <a href="/logout" className="mt-auto flex items-center gap-3 px-3 py-2 text-sm text-white/40 hover:text-white/70">
        <LogOut size={16} strokeWidth={1.75} /> Log out
      </a>
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
    <div className="border border-white/10 rounded-lg p-5 mb-8">
      <p className="text-sm text-white/60 mb-3">Shorten a new link</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-long-destination-url.com/..."
          className="flex-1 bg-white/[0.04] border border-white/10 rounded-md px-3 py-2 text-sm
                     text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#F6C9A0]" />
        <input value={alias} onChange={(e) => setAlias(e.target.value)}
          placeholder="custom-alias (optional)"
          className="sm:w-56 bg-white/[0.04] border border-white/10 rounded-md px-3 py-2 text-sm
                     text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#F6C9A0]" />
        <button onClick={shorten} disabled={busy}
          className={`px-5 py-2 rounded-md text-sm font-medium text-black ${BRAND_GRADIENT} disabled:opacity-50`}>
          {busy ? 'Creating…' : 'Shorten'}
        </button>
      </div>
      {result && (
        <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
          <span>{result}</span>
          <button onClick={() => navigator.clipboard.writeText(result)} className="text-white/40 hover:text-white/70">
            <Copy size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function LinksTable({ links }) {
  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-white/40 text-xs uppercase tracking-wide">
            <th className="px-5 py-3 font-medium">Link</th>
            <th className="px-5 py-3 font-medium">Destination</th>
            <th className="px-5 py-3 font-medium text-right">Views</th>
            <th className="px-5 py-3 font-medium text-right">Earnings</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {links.map((l) => (
            <tr key={l.id} className="border-b border-white/5 last:border-0">
              <td className="px-5 py-3 text-white/90">/{l.short_code || l.custom_alias}</td>
              <td className="px-5 py-3 text-white/50 truncate max-w-xs">{l.destination_url}</td>
              <td className="px-5 py-3 text-right text-white/80">{l.total_views.toLocaleString()}</td>
              <td className="px-5 py-3 text-right text-white/80">${l.total_earnings.toFixed(2)}</td>
              <td className="px-5 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  l.status === 'active' ? 'bg-emerald-400/10 text-emerald-300'
                  : l.status === 'blocked' ? 'bg-rose-400/10 text-rose-300'
                  : 'bg-white/10 text-white/40'}`}>
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
    <div className="min-h-screen bg-[#0B0A0C] text-white flex">
      <Sidebar active="links" />

      <main className="flex-1 px-10 py-8 max-w-6xl">
        <h1 className="text-xl font-serif italic text-white/90 mb-6">Overview</h1>

        {summary && (
          <div className="flex border border-white/10 rounded-lg mb-8 overflow-hidden">
            <StatLine label="Today's earnings" value={`$${summary.today.earnings.toFixed(2)}`}
              sublabel={`${summary.today.views.toLocaleString()} views today`} accent />
            <StatLine label="All-time earnings" value={`$${summary.allTime.earnings.toFixed(2)}`} />
            <StatLine label="Average CPM" value={`$${summary.allTime.avgCpm.toFixed(2)}`} />
            <StatLine label="Referral income" value={`$${summary.referralEarnings.toFixed(2)}`} />
            <StatLine label="Available balance" value={`$${summary.availableBalance.toFixed(2)}`}
              sublabel="Min. payout $5.00" />
          </div>
        )}

        <QuickShortener />

        {trend.length > 0 && (
          <div className="border border-white/10 rounded-lg p-5 mb-8 h-64">
            <p className="text-sm text-white/60 mb-3">Earnings, last 14 days</p>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={trend}>
                <XAxis dataKey="day" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#16151A', border: '1px solid #ffffff1a', fontSize: 12 }} />
                <Line type="monotone" dataKey="earnings" stroke="#F6C9A0" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <p className="text-sm text-white/60 mb-3">Your links</p>
        <LinksTable links={links} />
      </main>
    </div>
  );
}
