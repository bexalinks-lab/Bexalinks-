'use client';
// HelpView.jsx — Help Center tab: FAQ + support tickets.
import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FAQ = [
  ['How do I earn money?', 'Every valid, unique view on your short link earns you a CPM-based amount. The rate depends on the visitor\u2019s country. See the Rates page for details.'],
  ['When can I withdraw?', 'Once your available balance reaches the $5.00 minimum, open Payouts and request a withdrawal. Requests are reviewed and paid manually.'],
  ['Why didn\u2019t a view count?', 'Views from bots, repeated clicks from the same IP, or suspicious traffic are marked invalid by our fraud checks and do not earn.'],
  ['How do I create a short link?', 'On Overview, paste your long URL, add an optional custom alias, and press Shorten. Manage all links in the Links tab.'],
  ['How do referrals work?', 'Share your referral link from the Referrals tab. You earn a share of the income from publishers who sign up through it.'],
  ['Which payout methods are supported?', 'PayPal, Payoneer, bank transfer, USDT and UPI. Choose one in Payouts.'],
];

const INPUT = 'w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-2.5 text-base sm:text-sm font-body focus:outline-none focus:ring-2 focus:ring-indigo-400';

export default function HelpView({ PageHeader, toast }) {
  const [open, setOpen] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    fetch('/api/support/mine', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { tickets: [] }))
      .then((d) => setTickets(d.tickets || []))
      .catch(() => {});
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/support', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send. Try again.');
      setSubject(''); setMessage(''); toast('Ticket sent. We\u2019ll reply here.'); load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Help Center" subtitle="Quick answers, or send us a message." />
      <div className="glass rounded-3xl p-2 sm:p-3 mb-5">
        {FAQ.map(([q, a], i) => (
          <div key={q} className="border-b border-white/50 last:border-0">
            <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}
              className="w-full flex items-center justify-between gap-3 px-3 py-3 text-left font-body font-medium text-sm text-[var(--ink)]">
              {q}
              <ChevronDown size={16} className={`shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <p className="px-3 pb-3 font-body text-sm text-[var(--ink-soft)]">{a}</p>}
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="glass rounded-3xl p-4 sm:p-5 mb-5 flex flex-col gap-3">
        <h2 className="font-display font-bold text-base text-[var(--ink)]">Still need help?</h2>
        <input className={INPUT} placeholder="Subject" value={subject} maxLength={120} onChange={(e) => setSubject(e.target.value)} />
        <textarea className={INPUT} rows={4} placeholder="Describe your problem" value={message} maxLength={2000} onChange={(e) => setMessage(e.target.value)} />
        {error && <p role="alert" className="text-sm text-rose-600 font-body">{error}</p>}
        <button type="submit" disabled={busy || !subject.trim() || !message.trim()} className="btn btn-shorten px-8 py-2.5 rounded-full text-sm self-start">
          {busy ? 'Sending…' : 'Send ticket'}
        </button>
      </form>

      {tickets.length > 0 && (
        <div className="glass rounded-3xl p-4 sm:p-5">
          <h2 className="font-display font-bold text-base text-[var(--ink)] mb-3">Your tickets</h2>
          <div className="flex flex-col gap-3">
            {tickets.map((t) => (
              <div key={t.id} className="bg-white/50 rounded-2xl p-3 font-body text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-[var(--ink)]">{t.subject}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{t.status}</span>
                </div>
                <p className="text-[var(--ink-soft)] mt-1">{t.message}</p>
                {t.admin_reply && <p className="mt-2 pl-3 border-l-2 border-indigo-300 text-[var(--ink)]"><b>Reply:</b> {t.admin_reply}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
