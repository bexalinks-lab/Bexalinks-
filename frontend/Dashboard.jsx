'use client';
// Dashboard.jsx
// Publisher dashboard for Bexalink — Next.js + Tailwind.
// Matches LandingPage.jsx's ledger-paper design: paper background, ink-green
// text, hairline rules instead of card shadows, and tabular monospace
// numerals for every dollar and view count so figures read like a real
// statement rather than decorated UI copy.

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link2, Wallet, Users, TrendingUp, Copy, Settings, LogOut } from 'lucide-react';

function StatLine({ label, value, sublabel }) {
  return (
    <div className="py-4 px-4 sm:py-5 sm:px-6 border-b sm:border-b-0 sm:border-r border-[var(--line)] last:border-b-0 sm:last:border-r-0">
      <p className="text-xs font-body text-[var(--ink-faint)] mb-1.5 sm:mb-2">{label}</p>
      <p className="font-ledger text-xl sm:text-2xl text-[var(--ink)]">{value}</p>
      {sublabel && <p className="text-xs font-body text-[var(--ink-faint)] mt-1">{sublabel}</p>}
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
    <aside className="w-full sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-[var(--line)] flex flex-col py-4 sm:py-6 px-4 bg-[var(--surface)]">
      <div className="mb-4 sm:mb-10 px-2">
        <span className="font-display italic text-2xl text-[var(--ink)]">Bexalink</span>
      </div>
      <nav className="flex sm:flex-col gap-1 overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0 sm:overflow-visible">
        {items.map(({ key, label, icon: Icon }) => (
          <a key={key} href={`/dashboard/${key}`}
             className={`flex items-center gap-2 sm:gap-3 px-3 py-2 rounded text-sm font-body transition-colors whitespace-nowrap shrink-0
               ${active === key ? 'bg-[var(--paper)] text-[var(--ink)]' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'}`}>
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </a>
        ))}
      </nav>
      <a href="/logout" className="hidden sm:flex mt-auto items-center gap-3 px-3 py-2 text-sm font-body text-[var(--ink-faint)] hover:text-[var(--ink-soft)]">
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
    <div className="border border-[var(--line)] rounded bg-[var(--surface)] p-5 mb-8">
      <p className="text-sm font-body text-[var(--ink-soft)] mb-3">Shorten a new link</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-long-destination-url.com/..."
          className="flex-1 bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-sm font-body
                     text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--green)]" />
        <input value={alias} onChange={(e) => setAlias(e.target.value)}
          placeholder="custom-alias (optional)"
          className="sm:w-56 bg-[var(--paper)] border border-[var(--line)] rounded px-3 py-2 text-sm font-body
                     text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--green)]" />
        <button onClick={shorten} disabled={busy}
          className="px-5 py-2 rounded text-sm font-body font-medium text-white bg-[var(--green)] hover:bg-[var(--green-deep)] disabled:opacity-50 transition-colors">
          {busy ? 'Creating…' : 'Shorten'}
        </button>
      </div>
      {result && (
        <div className="mt-3 flex items-center gap-2 text-sm font-ledger text-[var(--ink-soft)]">
          <span>{result}</span>
          <button onClick={() => navigator.clipboard.writeText(result)} className="text-[var(--ink-faint)] hover:text-[var(--ink-soft)]">
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
      <div className="border border-[var(--line)] rounded bg-[var(--surface)] px-5 py-10 text-center">
        <p className="text-sm font-body text-[var(--ink-faint)]">No links yet. Shorten one above to see it here.</p>
      </div>
    );
  }
  return (
    <div className="border border-[var(--line)] rounded overflow-x-auto bg-[var(--surface)]">
      <table className="w-full min-w-[640px] text-sm font-body">
        <thead>
          <tr className="border-b border-[var(--line)] text-left text-[var(--ink-faint)] text-xs">
            <th className="px-5 py-3 font-medium">Link</th>
            <th className="px-5 py-3 font-medium">Destination</th>
            <th className="px-5 py-3 font-medium text-right">Views</th>
            <th className="px-5 py-3 font-medium text-right">Earnings</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {links.map((l) => (
            <tr key={l.id} className="border-b border-[var(--line)] last:border-0">
              <td className="px-5 py-3 font-ledger text-[var(--ink)]">/{l.short_code || l.custom_alias}</td>
              <td className="px-5 py-3 text-[var(--ink-soft)] truncate max-w-xs">{l.destination_url}</td>
              <td className="px-5 py-3 text-right font-ledger text-[var(--ink)]">{l.total_views.toLocaleString()}</td>
              <td className="px-5 py-3 text-right font-ledger text-[var(--ink)]">${l.total_earnings.toFixed(2)}</td>
              <td className="px-5 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-body ${
                  l.status === 'active' ? 'bg-[var(--green)]/10 text-[var(--green-deep)]'
                  : l.status === 'blocked' ? 'bg-rose-500/10 text-rose-700'
                  : 'bg-[var(--ink)]/5 text-[var(--ink-faint)]'}`}>
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
    <div className="min-h-screen bg-[var(--paper)] flex flex-col sm:flex-row">
      <Sidebar active="links" />

      <main className="flex-1 px-4 py-6 sm:px-10 sm:py-8 max-w-6xl w-full overflow-x-hidden">
        <h1 className="font-display italic text-xl text-[var(--ink)] mb-6">Overview</h1>

        {summary && (
          <div className="grid grid-cols-2 sm:flex border border-[var(--line)] rounded bg-[var(--surface)] mb-8 overflow-hidden">
            <StatLine label="Today's earnings" value={`$${summary.today.earnings.toFixed(2)}`}
              sublabel={`${summary.today.views.toLocaleString()} views today`} />
            <StatLine label="All-time earnings" value={`$${summary.allTime.earnings.toFixed(2)}`} />
            <StatLine label="Average CPM" value={`$${summary.allTime.avgCpm.toFixed(2)}`} />
            <StatLine label="Referral income" value={`$${summary.referralEarnings.toFixed(2)}`} />
            <StatLine label="Available balance" value={`$${summary.availableBalance.toFixed(2)}`}
              sublabel="Min. payout $5.00" />
          </div>
        )}

        <QuickShortener />

        {trend.length > 0 && (
          <div className="border border-[var(--line)] rounded bg-[var(--surface)] p-5 mb-8 h-64">
            <p className="text-sm font-body text-[var(--ink-soft)] mb-3">Earnings, last 14 days</p>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={trend}>
                <XAxis dataKey="day" stroke="#16241c60" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#16241c60" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #16241c22', fontSize: 12 }} />
                <Line type="monotone" dataKey="earnings" stroke="#1F7A4D" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <p className="text-sm font-body text-[var(--ink-soft)] mb-3">Your links</p>
        <LinksTable links={links} />
      </main>
    </div>
  );
}
