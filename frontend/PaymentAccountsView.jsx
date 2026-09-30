'use client';
// PaymentAccountsView.jsx — save, choose and remove payout accounts.
// Data: /api/payment-methods (see server/profile-routes.js). Saved details
// come back masked; the full value stays on the server and is used when a
// payout is requested to that account.

import { useState } from 'react';
import { Plus, Mail, Landmark, Smartphone, Coins, Star, Trash2, X, ShieldCheck } from 'lucide-react';
import {
  PageHeader, ErrorNote, Skeleton, Chips, INPUT, PAYOUT_METHODS, MIN_PAYOUT, api, money,
} from './dashboard-kit';

export const METHOD_STYLE = {
  paypal:   { icon: Mail,       tile: 'from-sky-400 to-blue-600' },
  payoneer: { icon: Mail,       tile: 'from-orange-400 to-red-500' },
  bank:     { icon: Landmark,   tile: 'from-amber-400 to-orange-500' },
  usdt:     { icon: Coins,      tile: 'from-emerald-400 to-teal-600' },
  upi:      { icon: Smartphone, tile: 'from-violet-400 to-purple-600' },
};
export const methodLabel = (key) => PAYOUT_METHODS.find((m) => m.key === key)?.label || key;

export function MethodTile({ method, size = 44 }) {
  const { icon: Icon, tile } = METHOD_STYLE[method] || METHOD_STYLE.bank;
  return (
    <span style={{ width: size, height: size }} className={`rounded-2xl bg-gradient-to-br ${tile} flex items-center justify-center shrink-0`}>
      <Icon size={size * 0.45} className="text-white" strokeWidth={2} />
    </span>
  );
}

function AddAccountForm({ hasAny, onDone, onCancel, toast }) {
  const [method, setMethod] = useState('upi');
  const [network, setNetwork] = useState('TRC20');
  const [account, setAccount] = useState('');
  const [fullName, setFullName] = useState('');
  const [makePrimary, setMakePrimary] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const cfg = PAYOUT_METHODS.find((m) => m.key === method);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const acct = account.trim();
    const verdict = cfg.check(acct, network);
    if (verdict !== true) return setError(verdict);
    setBusy(true);
    setError(null);
    try {
      await api('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method, account: acct, fullName: fullName.trim() || undefined,
          ...(cfg.networks ? { network } : {}), makePrimary: hasAny ? makePrimary : true,
        }),
      });
      toast('Payment account saved');
      onDone();
    } catch (err) {
      setError(err.message || 'Could not save this account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass-strong rounded-3xl p-5 mb-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-body font-semibold text-[var(--ink)]">Add a payment account</p>
        <button type="button" onClick={onCancel} aria-label="Close" className="btn btn-secondary w-8 h-8 rounded-full"><X size={14} /></button>
      </div>

      <div>
        <p className="text-xs font-body font-medium text-[var(--ink-faint)] mb-2">Method</p>
        <Chips label="Payout method" value={method}
          onChange={(k) => { setMethod(k); setError(null); setAccount(''); }}
          options={PAYOUT_METHODS.map((m) => ({ value: m.key, label: m.label }))} />
      </div>

      {cfg.networks && (
        <div>
          <p className="text-xs font-body font-medium text-[var(--ink-faint)] mb-2">Network</p>
          <Chips label="USDT network" value={network} onChange={(n) => { setNetwork(n); setError(null); }}
            options={cfg.networks.map((n) => ({ value: n, label: n }))} />
        </div>
      )}

      <label className="block">
        <span className="block text-xs font-body font-medium text-[var(--ink-faint)] mb-2">Account holder name (optional)</span>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} autoComplete="name" className={INPUT} />
      </label>

      <label className="block">
        <span className="block text-xs font-body font-medium text-[var(--ink-faint)] mb-2">{cfg.field}</span>
        {cfg.multiline ? (
          <textarea value={account} onChange={(e) => { setAccount(e.target.value); setError(null); }} rows={3}
            placeholder={cfg.placeholder} className={`${INPUT} resize-none`} />
        ) : (
          <input value={account} onChange={(e) => { setAccount(e.target.value); setError(null); }} placeholder={cfg.placeholder}
            type={method === 'paypal' || method === 'payoneer' ? 'email' : 'text'} autoComplete="off" spellCheck={false} className={INPUT} />
        )}
      </label>

      {hasAny && (
        <label className="flex items-center gap-2 text-xs font-body text-[var(--ink-soft)] cursor-pointer">
          <input type="checkbox" checked={makePrimary} onChange={(e) => setMakePrimary(e.target.checked)} className="accent-indigo-500" />
          Make this my primary account
        </label>
      )}

      {error && <p role="alert" className="text-sm font-body text-rose-600">{error}</p>}

      <button type="submit" disabled={busy} className="btn btn-primary font-body px-6 py-3 rounded-full text-sm self-start">
        {busy ? 'Saving…' : 'Save account'}
      </button>
    </form>
  );
}

export default function PaymentAccountsView({ accountsQ, toast, onChanged }) {
  const methods = Array.isArray(accountsQ.data?.methods) ? accountsQ.data.methods : [];
  const [adding, setAdding] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function act(id, fn, okMsg) {
    setBusyId(id);
    try {
      await fn();
      toast(okMsg);
      accountsQ.reload();
      onChanged?.();
    } catch (err) {
      toast(err.message || 'Something went wrong', 'error');
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  }
  const makePrimary = (id) => act(id, () => api(`/api/payment-methods/${id}/primary`, { method: 'POST' }), 'Primary account updated');
  const remove = (id) => act(id, () => api(`/api/payment-methods/${id}`, { method: 'DELETE' }), 'Account removed');

  return (
    <>
      <PageHeader
        title="Payment accounts"
        subtitle="Save where you want to be paid, then pick it when you request a payout."
        action={!adding && (
          <button type="button" onClick={() => setAdding(true)} className="btn btn-primary font-body px-4 py-2.5 rounded-full text-sm shrink-0">
            <Plus size={15} /> Add account
          </button>
        )}
      />

      {adding && (
        <AddAccountForm hasAny={methods.length > 0} toast={toast}
          onCancel={() => setAdding(false)}
          onDone={() => { setAdding(false); accountsQ.reload(); onChanged?.(); }} />
      )}

      {accountsQ.error && methods.length === 0 ? (
        <ErrorNote message="Couldn't load your payment accounts." onRetry={accountsQ.reload} />
      ) : accountsQ.loading && methods.length === 0 ? (
        <Skeleton className="h-28 w-full" />
      ) : methods.length === 0 && !adding ? (
        <div className="glass rounded-3xl px-5 py-10 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white/70 flex items-center justify-center"><Landmark size={20} className="text-[var(--ink-soft)]" /></div>
          <p className="text-sm font-body font-medium text-[var(--ink)]">No payment account yet</p>
          <p className="text-sm font-body text-[var(--ink-faint)] mt-1 mb-5">Add a UPI ID, PayPal, bank account or USDT wallet to get paid.</p>
          <button type="button" onClick={() => setAdding(true)} className="btn btn-primary font-body px-5 py-2.5 rounded-full text-sm"><Plus size={15} /> Add account</button>
        </div>
      ) : (
        <ul className="grid md:grid-cols-2 gap-4">
          {methods.map((m) => (
            <li key={m.id} className={`rounded-3xl p-5 flex flex-col gap-4 ${m.isPrimary ? 'glass-strong border border-black' : 'glass'}`}>
              <div className="flex items-start gap-3">
                <MethodTile method={m.method} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display font-bold text-base text-[var(--ink)]">{methodLabel(m.method)}</p>
                    {m.network && <span className="text-xs px-2 py-0.5 rounded-full font-body font-medium bg-slate-500/10 text-slate-600">{m.network}</span>}
                    {m.isPrimary && <span className="text-xs px-2.5 py-0.5 rounded-full font-body font-medium bg-emerald-500/15 text-emerald-700">Primary</span>}
                  </div>
                  <p className="text-sm font-body text-[var(--ink)] mt-1 break-all">{m.maskedAccount}</p>
                  {m.fullName && <p className="text-xs font-body text-[var(--ink-faint)] mt-0.5">{m.fullName}</p>}
                </div>
              </div>

              {confirmId === m.id ? (
                <div className="flex items-center gap-2">
                  <p className="text-xs font-body text-[var(--ink-soft)] flex-1">Remove this account?</p>
                  <button type="button" onClick={() => setConfirmId(null)} className="btn btn-secondary px-4 py-2 rounded-full text-xs font-body">Keep</button>
                  <button type="button" disabled={busyId === m.id} onClick={() => remove(m.id)} className="btn btn-primary px-4 py-2 rounded-full text-xs font-body">Remove</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {!m.isPrimary && (
                    <button type="button" disabled={busyId === m.id} onClick={() => makePrimary(m.id)} className="btn btn-secondary px-4 py-2 rounded-full text-xs font-body">
                      <Star size={13} /> Make primary
                    </button>
                  )}
                  <button type="button" onClick={() => setConfirmId(m.id)} aria-label={`Remove ${methodLabel(m.method)} account`}
                    className="btn btn-secondary w-9 h-9 rounded-full ml-auto"><Trash2 size={14} /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-start gap-2 text-xs font-body text-[var(--ink-faint)] mt-6 px-1">
        <ShieldCheck size={14} className="shrink-0 mt-px" />
        Account details are hidden after you save them. Minimum payout is {money(MIN_PAYOUT)}.
      </p>
    </>
  );
}
