'use client';
import { useEffect, useState } from 'react';
import BrandLogo from './BrandLogo';

export default function AdminSupport() {
  const [tickets, setTickets] = useState(null);
  const [replies, setReplies] = useState({});
  const [err, setErr] = useState('');

  const load = () =>
    fetch('/api/admin/support', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Admin access required.'))))
      .then((d) => setTickets(d.tickets))
      .catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);

  async function send(id, resolve) {
    await fetch(`/api/admin/support/${id}/reply`, {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply: replies[id] || '', resolve }),
    });
    load();
  }

  return (
    <main className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-5">
        <BrandLogo size="sm" href="/dashboard" />
        <a href="/dashboard#help" className="text-sm font-body text-[var(--ink-soft)]">← Dashboard</a>
      </div>
      <h1 className="font-display font-bold text-2xl mb-4">Support tickets</h1>
      {err && <p className="text-rose-600 text-sm">{err}</p>}
      {tickets && tickets.length === 0 && <p className="font-body text-sm">No tickets yet.</p>}
      <div className="flex flex-col gap-3">
        {(tickets || []).map((t) => (
          <div key={t.id} className="glass rounded-2xl p-4 font-body text-sm">
            <div className="flex justify-between gap-2">
              <b>{t.subject}</b><span>{t.status}</span>
            </div>
            <p className="text-xs text-[var(--ink-faint)]">{t.display_name || ''} {t.email}</p>
            <p className="mt-2">{t.message}</p>
            <textarea rows={2} defaultValue={t.admin_reply || ''} onChange={(e) => setReplies({ ...replies, [t.id]: e.target.value })}
              placeholder="Reply to user" className="w-full mt-3 bg-white/60 border border-white/70 rounded-xl px-3 py-2 text-base sm:text-sm" />
            <div className="flex gap-2 mt-2">
              <button className="btn btn-shorten px-4 py-1.5 rounded-full text-xs" onClick={() => send(t.id, true)}>Reply &amp; resolve</button>
              {t.status === 'resolved' && <button className="px-4 py-1.5 rounded-full text-xs border border-black" onClick={() => send(t.id, false)}>Reopen</button>}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
