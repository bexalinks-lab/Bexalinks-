import { DollarSign, Clock3, CalendarClock, Wallet2 } from 'lucide-react';
import { StaticHeader, StaticFooter } from '../../frontend/StaticPageChrome';

export const metadata = {
  title: 'Rates — Bexalink',
  description: 'Current per-1,000-view CPM rates by country, and how Bexalink payouts work.',
};

const RATES = [
  { country: 'United States', cpm: 6.2, flag: '🇺🇸' },
  { country: 'United Kingdom', cpm: 5.4, flag: '🇬🇧' },
  { country: 'Germany', cpm: 5.1, flag: '🇩🇪' },
  { country: 'India', cpm: 1.3, flag: '🇮🇳' },
  { country: 'Brazil', cpm: 1.6, flag: '🇧🇷' },
  { country: 'Global average', cpm: 2.9, flag: '🌍' },
];

const PAYOUT_POINTS = [
  {
    icon: DollarSign,
    gradient: 'bg-indigo-500',
    title: '$5 minimum, on any method',
    text: 'Once your balance clears $5, you can cash out — no higher thresholds hiding behind different payout options.',
  },
  {
    icon: Clock3,
    gradient: 'bg-emerald-500',
    title: 'Same-day, most of the time',
    text: 'Withdrawal requests are reviewed by our team and typically paid out the same day. Weekends can occasionally add a short delay.',
  },
  {
    icon: CalendarClock,
    gradient: 'bg-amber-500',
    title: 'No fixed payout cycle',
    text: "Request a withdrawal whenever you want, 24/7 — you're never stuck waiting for a weekly or monthly cutoff.",
  },
  {
    icon: Wallet2,
    gradient: 'bg-pink-500',
    title: '5 ways to get paid',
    text: 'PayPal, Payoneer, bank transfer, USDT, or UPI — pick whichever is easiest to use where you live.',
  },
];

export default function RatesPage() {
  return (
    <>
      <StaticHeader />
      <main className="px-6 sm:px-10 py-14 max-w-3xl mx-auto">
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-[var(--ink)] mb-3">
          Priced by where your viewer is.
        </h1>
        <p className="font-body text-[var(--ink-soft)] text-sm leading-relaxed max-w-lg mb-10">
          The figures below are current per-1,000-view averages. Your dashboard shows the live rate
          for every country sending you traffic.
        </p>

        <div className="glass rounded-3xl px-6 py-2 mb-14">
          {RATES.map((r) => (
            <div key={r.country} className="flex items-center justify-between py-3 border-b border-white/40 last:border-0">
              <span className="font-body text-sm text-[var(--ink)] flex items-center gap-2">
                <span className="text-lg" aria-hidden="true">{r.flag}</span>
                {r.country}
              </span>
              <span className="font-display font-semibold text-sm text-[var(--ink)]">${r.cpm.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <h2 className="font-display font-bold text-2xl sm:text-3xl text-[var(--ink)] mb-2">How payouts work.</h2>
        <p className="font-body text-[var(--ink-soft)] text-sm leading-relaxed max-w-lg mb-8">
          Straightforward, on purpose — no tiers to unlock, no surprise deductions.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          {PAYOUT_POINTS.map((p) => (
            <div key={p.title} className="glass rounded-3xl p-6 flex gap-4">
              <span className={`shrink-0 w-11 h-11 rounded-2xl ${p.gradient} flex items-center justify-center`}>
                <p.icon size={18} className="text-white" />
              </span>
              <div>
                <h3 className="font-body text-[var(--ink)] text-sm font-bold mb-1.5">{p.title}</h3>
                <p className="font-body text-[var(--ink-soft)] text-sm leading-relaxed">{p.text}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <StaticFooter />
    </>
  );
}
