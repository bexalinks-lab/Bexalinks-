'use client';
// AdminAds.jsx
// Simple admin screen for managing the ad scripts shown on the interstitial
// pages. Talks to the endpoints added in server/api-routes.js:
//   GET    /api/admin/ad-slots
//   POST   /api/admin/ad-slots
//   PUT    /api/admin/ad-slots/:id
//   DELETE /api/admin/ad-slots/:id
// Only a user with role = 'admin' can use this — everyone else sees a
// friendly "not authorized" message instead of the form.

import { useEffect, useState } from 'react';
import { Trash2, Power, Plus } from 'lucide-react';
import BrandLogo from './BrandLogo';

const STEPS = [
  { value: 'step1_landing', label: 'Step 1 — Landing page' },
  { value: 'step2_verify', label: 'Step 2 — Verify page' },
  { value: 'step3_getlink', label: 'Step 3 — Get-link page' },
];

const INPUT =
  'w-full bg-white/60 border border-white/70 rounded-2xl px-4 py-2.5 text-sm font-body ' +
  'text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:ring-2 focus:ring-indigo-400';

async function api(url, options) {
  const res = await fetch(url, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...options });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

export default function AdminAds() {
  const [status, setStatus] = useState('loading'); // loading | denied | ready
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [network, setNetwork] = useState('');
  const [step, setStep] = useState(STEPS[0].value);
  const [placement, setPlacement] = useState('banner_top');
  const [scriptCode, setScriptCode] = useState('');
  const [countryFilter, setCountryFilter] = useState('');

  async function loadSlots() {
    try {
      const data = await api('/api/admin/ad-slots');
      setSlots(data.adSlots || []);
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

  useEffect(() => { loadSlots(); }, []);

  async function onAdd(e) {
    e.preventDefault();
    if (!network.trim() || !scriptCode.trim() || !placement.trim()) {
      setError('Network, placement and the ad script are required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const countries = countryFilter
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean);
      await api('/api/admin/ad-slots', {
        method: 'POST',
        body: JSON.stringify({
          network: network.trim(),
          step,
          placement: placement.trim(),
          scriptCode,
          countryFilter: countries.length ? countries : null,
        }),
      });
      setNetwork(''); setScriptCode(''); setCountryFilter(''); setPlacement('banner_top');
      await loadSlots();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(slot) {
    try {
      await api(`/api/admin/ad-slots/${slot.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !slot.is_active }),
      });
      await loadSlots();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(slot) {
    if (!window.confirm(`Delete this ${slot.network} ad slot? This can't be undone.`)) return;
    try {
      await api(`/api/admin/ad-slots/${slot.id}`, { method: 'DELETE' });
      await loadSlots();
    } catch (err) {
      setError(err.message);
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
            You need to be logged in with an admin account to manage ads.
          </p>
          <a href="/login" className="btn btn-primary font-body px-5 py-2.5 rounded-full text-sm inline-block">Log in</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-8 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <BrandLogo href="/dashboard" />
        <a href="/dashboard" className="text-sm font-body text-[var(--ink-soft)] hover:text-[var(--ink)]">Back to dashboard</a>
      </div>

      <h1 className="font-display font-bold text-2xl text-[var(--ink)] mb-1">Manage ads</h1>
      <p className="font-body text-sm text-[var(--ink-soft)] mb-6">
        Paste the embed code your ad network (Adsterra, PropellerAds, Monetag, etc.) gives you. It will show up
        on the matching interstitial step for every visitor — filtered by country if you set one.
      </p>

      {error && (
        <p className="text-sm font-body text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 mb-4">{error}</p>
      )}

      <form onSubmit={onAdd} className="glass rounded-3xl p-5 mb-8 flex flex-col gap-3">
        <p className="text-sm font-semibold text-[var(--ink)]">Add a new ad</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="Network (e.g. adsterra)" className={INPUT} />
          <select value={step} onChange={(e) => setStep(e.target.value)} className={INPUT}>
            {STEPS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input value={placement} onChange={(e) => setPlacement(e.target.value)} placeholder="Placement (e.g. banner_top)" className={INPUT} />
          <input
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            placeholder="Country codes, comma-separated (optional, e.g. US,IN)"
            className={INPUT}
          />
        </div>

        <textarea
          value={scriptCode}
          onChange={(e) => setScriptCode(e.target.value)}
          placeholder="<script>...paste your ad network's embed code here...</script>"
          rows={5}
          className={`${INPUT} rounded-2xl font-mono text-xs`}
        />

        <button type="submit" disabled={busy} className="btn btn-primary font-body px-6 py-2.5 rounded-full text-sm self-start flex items-center gap-2">
          <Plus size={14} /> {busy ? 'Adding…' : 'Add ad'}
        </button>
      </form>

      <p className="text-sm font-semibold text-[var(--ink)] mb-3">Existing ads ({slots.length})</p>
      <div className="flex flex-col gap-3">
        {slots.length === 0 && (
          <p className="font-body text-sm text-[var(--ink-faint)]">No ads yet — add one above.</p>
        )}
        {slots.map((slot) => (
          <div key={slot.id} className="glass rounded-2xl p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-body font-semibold text-sm text-[var(--ink)]">
                {slot.network} · {slot.placement}
              </p>
              <p className="font-body text-xs text-[var(--ink-faint)] mt-0.5">
                {STEPS.find((s) => s.value === slot.step)?.label || slot.step}
                {slot.country_filter?.length ? ` · ${slot.country_filter.join(', ')}` : ' · all countries'}
              </p>
              <p className={`font-body text-xs mt-1 ${slot.is_active ? 'text-emerald-600' : 'text-[var(--ink-faint)]'}`}>
                {slot.is_active ? 'Active' : 'Paused'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => toggleActive(slot)}
                aria-label={slot.is_active ? 'Pause' : 'Activate'}
                className="btn btn-secondary w-9 h-9 rounded-full flex items-center justify-center"
              >
                <Power size={14} />
              </button>
              <button
                type="button"
                onClick={() => remove(slot)}
                aria-label="Delete"
                className="btn btn-secondary w-9 h-9 rounded-full flex items-center justify-center text-rose-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
