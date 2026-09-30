'use client';
// ProfileView.jsx — full user profile: identity, account stats, editable
// personal + billing details, sign-in methods.
// Data: GET/PUT /api/profile (see server/profile-routes.js).

import { useEffect, useMemo, useState } from 'react';
import { Copy, LogOut, Mail, KeyRound, CalendarDays } from 'lucide-react';
import {
  PageHeader, StatCard, Skeleton, ErrorNote, INPUT, api, copyText, money, fmtInt, fmtDate,
} from './dashboard-kit';

const EMPTY = {
  displayName: '', firstName: '', lastName: '', phone: '',
  address1: '', address2: '', city: '', state: '', zip: '', country: '',
};

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-body font-medium text-[var(--ink-faint)] mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Avatar({ url, name, email }) {
  const initials = (name || email || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const [broken, setBroken] = useState(false);
  return url && !broken ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)}
      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
  ) : (
    <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center">
      <span className="font-display font-bold text-2xl text-white">{initials}</span>
    </div>
  );
}

export default function ProfileView({ profileQ, summary, summaryLoading, toast, onSaved }) {
  const data = profileQ.data && !profileQ.data.error ? profileQ.data : null;
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Load server values into the form once they arrive (or after a save).
  useEffect(() => {
    if (!data) return;
    const next = { displayName: data.user.displayName || '', ...data.profile };
    setForm(next);
    setSaved(next);
  }, [data]);

  const dirty = useMemo(() => Object.keys(EMPTY).some((k) => (form[k] || '') !== (saved[k] || '')), [form, saved]);
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError(null); };

  async function submit(e) {
    e.preventDefault();
    if (busy || !dirty) return;
    setBusy(true);
    setError(null);
    try {
      await api('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      toast('Profile saved');
      onSaved();
    } catch (err) {
      setError(err.message || 'Could not save your profile.');
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    const ok = await copyText(data?.user.referralCode || '');
    toast(ok ? 'Referral code copied' : 'Could not copy', ok ? 'ok' : 'error');
  }

  if (profileQ.error && !data) {
    return (
      <>
        <PageHeader title="Profile" subtitle="Your account details." />
        <ErrorNote message="Couldn't load your profile." onRetry={profileQ.reload} />
      </>
    );
  }

  const user = data?.user;
  const shownName = form.displayName || [form.firstName, form.lastName].filter(Boolean).join(' ') || user?.email;

  return (
    <>
      <PageHeader title="Profile" subtitle="Your details, billing address and sign-in methods." />

      {/* identity */}
      <div className="relative p-6 mb-6 overflow-hidden glass-strong" style={{ borderRadius: 40 }}>
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-200/60 via-sky-100/40 to-pink-100/50" />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 opacity-25 blur-2xl -z-10" />
        {!data ? (
          <div className="flex items-center gap-4"><Skeleton className="h-20 w-20 rounded-full" /><Skeleton className="h-10 w-48" /></div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar url={user.avatarUrl} name={shownName} email={user.email} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display font-bold text-xl text-[var(--ink)] truncate">{shownName}</p>
                <span className="text-xs px-2.5 py-1 rounded-full font-body font-medium bg-indigo-500/15 text-indigo-700 capitalize">{user.role}</span>
              </div>
              <p className="font-body text-sm text-[var(--ink-soft)] truncate">{user.email}</p>
              <p className="font-body text-xs text-[var(--ink-faint)] mt-1 flex items-center gap-1.5">
                <CalendarDays size={12} /> Member since {fmtDate(user.memberSince)}
              </p>
            </div>
            {user.referralCode && (
              <button type="button" onClick={copyCode}
                className="glass rounded-2xl px-4 py-2.5 text-left self-start sm:self-center hover:bg-white/60 transition-colors">
                <p className="text-xs font-body text-[var(--ink-faint)] flex items-center gap-1.5">Referral code <Copy size={11} /></p>
                <p className="font-display font-bold tracking-wider text-[var(--ink)]">{user.referralCode}</p>
              </button>
            )}
          </div>
        )}
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard loading={!data} label="Links created" value={fmtInt(data?.stats.totalLinks)} gradient="bg-indigo-500" />
        <StatCard loading={!data} label="Total views" value={fmtInt(data?.stats.totalViews)} gradient="bg-sky-400" />
        <StatCard loading={summaryLoading} label="All-time earnings" value={money(summary?.allTime?.earnings)} gradient="bg-pink-500" />
        <StatCard loading={!data} label="Publishers referred" value={fmtInt(data?.stats.referrals)} gradient="bg-violet-500" />
      </div>

      {/* details form */}
      <form onSubmit={submit} className="glass rounded-3xl p-5 mb-6 flex flex-col gap-6">
        <div>
          <p className="text-sm font-body font-semibold text-[var(--ink)] mb-4">Personal details</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="First name"><input value={form.firstName} onChange={set('firstName')} autoComplete="given-name" maxLength={80} className={INPUT} /></Field>
            <Field label="Last name"><input value={form.lastName} onChange={set('lastName')} autoComplete="family-name" maxLength={80} className={INPUT} /></Field>
            <Field label="Display name"><input value={form.displayName} onChange={set('displayName')} placeholder="Shown in your dashboard" maxLength={120} className={INPUT} /></Field>
            <Field label="Phone"><input value={form.phone} onChange={set('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="+91 98765 43210" maxLength={24} className={INPUT} /></Field>
            <Field label="Email" className="sm:col-span-2">
              <input value={user?.email || ''} readOnly aria-readonly="true" className={`${INPUT} bg-slate-100 text-[var(--ink-soft)] cursor-not-allowed`} />
            </Field>
          </div>
        </div>

        <div>
          <p className="text-sm font-body font-semibold text-[var(--ink)] mb-4">Billing address</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Address line 1" className="sm:col-span-2"><input value={form.address1} onChange={set('address1')} autoComplete="address-line1" maxLength={160} className={INPUT} /></Field>
            <Field label="Address line 2" className="sm:col-span-2"><input value={form.address2} onChange={set('address2')} autoComplete="address-line2" maxLength={160} className={INPUT} /></Field>
            <Field label="City"><input value={form.city} onChange={set('city')} autoComplete="address-level2" maxLength={80} className={INPUT} /></Field>
            <Field label="State"><input value={form.state} onChange={set('state')} autoComplete="address-level1" maxLength={80} className={INPUT} /></Field>
            <Field label="ZIP / postal code"><input value={form.zip} onChange={set('zip')} autoComplete="postal-code" maxLength={16} className={INPUT} /></Field>
            <Field label="Country"><input value={form.country} onChange={set('country')} autoComplete="country-name" maxLength={80} className={INPUT} /></Field>
          </div>
        </div>

        {error && <p role="alert" className="text-sm font-body text-rose-600">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={busy || !dirty || !data} className="btn btn-primary font-body px-6 py-3 rounded-full text-sm">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
          {dirty && !busy && (
            <button type="button" onClick={() => { setForm(saved); setError(null); }} className="btn btn-secondary font-body px-5 py-3 rounded-full text-sm">
              Discard
            </button>
          )}
        </div>
      </form>

      {/* sign-in */}
      <div className="glass rounded-3xl p-5 max-w-xl">
        <p className="text-sm font-body font-semibold text-[var(--ink)] mb-4">Sign-in methods</p>
        <ul className="flex flex-col gap-3 mb-5">
          {[
            { icon: KeyRound, label: 'Email & password', on: user?.hasPassword },
            { icon: Mail, label: 'Google', on: user?.hasGoogle },
          ].map(({ icon: Icon, label, on }) => (
            <li key={label} className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center shrink-0"><Icon size={16} className="text-[var(--ink-soft)]" /></span>
              <span className="flex-1 text-sm font-body text-[var(--ink)]">{label}</span>
              {!data ? <Skeleton className="h-6 w-16" /> : (
                <span className={`text-xs px-2.5 py-1 rounded-full font-body font-medium ${on ? 'bg-emerald-500/15 text-emerald-700' : 'bg-slate-500/10 text-slate-500'}`}>
                  {on ? 'Connected' : 'Not set'}
                </span>
              )}
            </li>
          ))}
        </ul>
        <a href="/logout" className="btn btn-secondary font-body px-5 py-2.5 rounded-full text-sm"><LogOut size={14} /> Log out</a>
      </div>
    </>
  );
}
