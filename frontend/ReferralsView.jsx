'use client';
// ReferralsView.jsx — referral link, share buttons, stats and referred users.
// Data: GET /api/dashboard/referrals (see server/profile-routes.js).

import { Copy, Share2, Users, Percent, Wallet, Send, MessageCircle } from 'lucide-react';
import { PageHeader, StatCard, Skeleton, ErrorNote, copyText, money, fmtInt, fmtDate } from './dashboard-kit';

const STEPS = [
  { title: 'Share your link', text: 'Post it in your channel, group or website.' },
  { title: 'They sign up', text: 'Anyone who joins through your link is tied to your account.' },
  { title: 'You earn for life', text: 'A share of everything they earn is added to your balance.' },
];

export default function ReferralsView({ referral, code, ratePercent, last30Days, summary, loading, toast, onRetry }) {
  const { url, count, list, error, loading: refLoading } = referral;
  const shareText = 'Shorten links and get paid for every view on Bexalink.';

  async function copy(value, msg) {
    if (!value) return;
    const ok = await copyText(value);
    toast(ok ? msg : 'Could not copy', ok ? 'ok' : 'error');
  }
  async function nativeShare() {
    if (!url) return;
    if (navigator.share) {
      try { await navigator.share({ title: 'Bexalink', text: shareText, url }); } catch { /* dismissed */ }
    } else {
      copy(url, 'Referral link copied');
    }
  }

  return (
    <>
      <PageHeader
        title="Referrals"
        subtitle={`Invite publishers and earn ${ratePercent}% of their earnings, for life.`}
      />

      {error && !url && <ErrorNote message="Couldn't load your referral details." onRetry={onRetry} />}

      <div className="relative p-6 mb-6 overflow-hidden glass-strong" style={{ borderRadius: 40 }}>
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-200/60 via-indigo-100/40 to-pink-100/50" />
        <p className="font-display font-bold text-lg text-[var(--ink)] mb-1">Your referral link</p>
        <p className="font-body text-sm text-[var(--ink-soft)] mb-4">
          Every publisher who signs up through this link is linked to you.
        </p>

        {url ? (
          <>
            <div className="flex items-center gap-2 bg-white/70 border border-white/80 rounded-full pl-5 pr-2 py-2 mb-3 min-w-0">
              <span className="flex-1 truncate text-sm font-body text-[var(--ink)]">{url}</span>
              <button type="button" onClick={() => copy(url, 'Referral link copied')} aria-label="Copy referral link"
                className="btn btn-primary w-9 h-9 shrink-0 rounded-full">
                <Copy size={14} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`} target="_blank" rel="noopener noreferrer"
                className="btn btn-secondary font-body px-4 py-2 rounded-full text-sm">
                <MessageCircle size={14} /> WhatsApp
              </a>
              <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
                className="btn btn-secondary font-body px-4 py-2 rounded-full text-sm">
                <Send size={14} /> Telegram
              </a>
              <button type="button" onClick={nativeShare} className="btn btn-secondary font-body px-4 py-2 rounded-full text-sm">
                <Share2 size={14} /> More
              </button>
            </div>

            {code && (
              <div className="mt-5 pt-4 border-t border-white/60 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-body text-[var(--ink-faint)]">Referral code</p>
                  <p className="font-display font-bold text-base tracking-wider text-[var(--ink)]">{code}</p>
                </div>
                <button type="button" onClick={() => copy(code, 'Referral code copied')}
                  className="btn btn-secondary font-body px-4 py-2 rounded-full text-xs shrink-0">
                  <Copy size={13} /> Copy code
                </button>
              </div>
            )}
          </>
        ) : refLoading ? (
          <Skeleton className="h-11 w-full" />
        ) : (
          <p className="text-sm font-body text-[var(--ink-soft)]">Your referral link isn&apos;t available yet.</p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <StatCard loading={loading} label="Referral income" value={money(summary?.referralEarnings)}
          sublabel={last30Days != null ? `${money(last30Days)} in 30 days` : undefined} gradient="bg-violet-500" />
        <StatCard loading={refLoading} label="Publishers referred" value={count != null ? fmtInt(count) : '0'} gradient="bg-sky-400" />
        <div className="col-span-2 sm:col-span-1">
          <StatCard loading={false} label="Your commission" value={`${ratePercent}%`} sublabel="Lifetime, on every referral" gradient="bg-emerald-500" />
        </div>
      </div>

      <div className="glass rounded-3xl p-5 mb-6">
        <p className="text-sm font-body font-semibold text-[var(--ink)] mb-4">How it works</p>
        <ol className="grid sm:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex sm:flex-col items-start gap-3">
              <span className="w-8 h-8 shrink-0 rounded-full bg-[var(--ink)] text-white text-sm font-display font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-body font-semibold text-[var(--ink)]">{s.title}</p>
                <p className="text-sm font-body text-[var(--ink-soft)] mt-0.5">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-sm font-body font-semibold text-[var(--ink)]">Your referrals</p>
        {count > 0 && <span className="text-xs font-body text-[var(--ink-faint)]">{fmtInt(count)} total</span>}
      </div>

      {list.length === 0 ? (
        <div className="glass rounded-3xl px-5 py-10 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white/70 flex items-center justify-center">
            <Users size={20} className="text-[var(--ink-soft)]" />
          </div>
          <p className="text-sm font-body font-medium text-[var(--ink)]">No referrals yet</p>
          <p className="text-sm font-body text-[var(--ink-faint)] mt-1">Publishers who join with your link will appear here.</p>
        </div>
      ) : (
        <div className="glass rounded-3xl overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm font-body">
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
                  <td className="px-5 py-3">
                    <p className="text-[var(--ink)] font-medium">{r.name || `Publisher ${i + 1}`}</p>
                    {r.email && <p className="text-xs text-[var(--ink-faint)]">{r.email}</p>}
                  </td>
                  <td className="px-5 py-3 text-[var(--ink-soft)] whitespace-nowrap">{fmtDate(r.joined_at)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-[var(--ink)]">{money(r.earned)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
