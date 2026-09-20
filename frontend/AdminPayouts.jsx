'use client';
// AdminPayouts.jsx
// Lets an admin see every payout request and mark it approved / paid /
// rejected. Talks to the endpoints added in server/api-routes.js:
//   GET  /api/admin/payouts
//   POST /api/admin/payouts/:id/approve
//   POST /api/admin/payouts/:id/mark-paid
//   POST /api/admin/payouts/:id/reject

import { useEffect, useState } from 'react';
import BrandLogo from './BrandLogo';

async function api(url, options) {
  const res = await fetch(url, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...options });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

const STATUS_STYLES = {
  pending: 'text-amber-600',
  approved: 'text-sky-600',
  paid: 'text-emerald-600',
  rejected: 'text-rose-600',
};

export default function AdminPayouts() {
  const [status, setStatus] = useState('loading'); // loading | denied | ready
  const [payouts, setPayouts] = useState([]);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      const data = await api('/api/admin/payouts');
      setPayouts(Array.isArray(data) ? data : []);
      setStatus('ready');
    } catch (err) {
      if (err.message.includes('Admin only') || err.message.includes('Not authenticated')) {
        setStatus('denied');
      } else {
        setError(err.message);
        setStatus('ready');
      }
    }
  }

  useEffect(() => { load(); }, []);

  async function act(id, action) {
    if (action === 'reject' && !window.confirm('Reject this payout request?')) return;
    setBusyId(id);
    setError(null);
    try {
      await api(`/api/admin/payouts/${id}/${action}`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (status === 'loading') return null;

  if (status === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-strong rounded-3xl p-8 max-w-sm text-center">
          <div className="flex justify-center mb-4"><BrandLogo href="/" /></div>
          <h1 className="font-display font-bold text-xl text-[var(--ink)] mb-2">Admins only</h1>
          <p className="font-body text-sm text-[var(--ink-soft)] mb-4">
            You need to be logged in with an admin account to manage payouts.
          </p>
          <a href="/login" className="btn btn-primary font-body px-5 py-2.5 rounded-full text-sm inline-block">Log in</a>
        </div>
      </div>
    );
  }

  const pending = payouts.filter((p) => p.status === 'pending' || p.status === 'approved');
  const done = payouts.filter((p) => p.status === 'paid' || p.status === 'rejected');

  return (
    <div className="min-h-screen px-4 sm:px-8 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <BrandLogo href="/dashboard" />
        <a href="/dashboard" className="text-sm font-body text-[var(--ink-soft)] hover:text-[var(--ink)]">Back to dashboard</a>
      </div>

      <h1 className="font-display font-bold text-2xl text-[var(--ink)] mb-1">Payout requests</h1>
      <p className="font-body text-sm text-[var(--ink-soft)] mb-6">
        Send the money yourself via PayPal/bank/crypto using the account details shown, then mark it paid here.
      </p>

      {error && (
        <p className="text-sm font-body text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 mb-4">{error}</p>
      )}

      <p className="text-sm font-semibold text-[var(--ink)] mb-3">Needs action ({pending.length})</p>
      <div className="flex flex-col gap-3 mb-8">
        {pending.length === 0 && <p className="font-body text-sm text-[var(--ink-faint)]">Nothing pending right now.</p>}
        {pending.map((p) => (
          <div key={p.id} className="glass rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="font-body font-semibold text-sm text-[var(--ink)]">
                ${p.amount.toFixed(2)} · {p.method}{p.network ? ` (${p.network})` : ''}
              </p>
              <p className="font-body text-xs text-[var(--ink-soft)] mt-0.5 break-all">{p.account}</p>
              <p className="font-body text-xs text-[var(--ink-faint)] mt-1">
                {p.email} · <span className={STATUS_STYLES[p.status]}>{p.status}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {p.status === 'pending' && (
                <button type="button" disabled={busyId === p.id} onClick={() => act(p.id, 'approve')}
                  className="btn btn-secondary px-4 py-2 rounded-full text-xs font-body">
                  Approve
                </button>
              )}
              <button type="button" disabled={busyId === p.id} onClick={() => act(p.id, 'mark-paid')}
                className="btn btn-primary px-4 py-2 rounded-full text-xs font-body">
                Mark paid
              </button>
              <button type="button" disabled={busyId === p.id} onClick={() => act(p.id, 'reject')}
                className="btn btn-secondary px-4 py-2 rounded-full text-xs font-body text-rose-600">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm font-semibold text-[var(--ink)] mb-3">History ({done.length})</p>
      <div className="flex flex-col gap-2">
        {done.length === 0 && <p className="font-body text-sm text-[var(--ink-faint)]">No processed payouts yet.</p>}
        {done.map((p) => (
          <div key={p.id} className="glass rounded-2xl p-3 flex items-center justify-between text-sm font-body">
            <span className="text-[var(--ink)]">${p.amount.toFixed(2)} · {p.method} · {p.email}</span>
            <span className={STATUS_STYLES[p.status]}>{p.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
