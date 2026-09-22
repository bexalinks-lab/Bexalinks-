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

        <div className="glass rounded-3xl px-6 py-2 mb-6">
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

        <div className="glass rounded-3xl px-6 py-5 flex flex-col gap-3 font-body text-sm text-[var(--ink-soft)]">
          <p>→ Minimum withdrawal is <strong className="text-[var(--ink)]">$5</strong>, on any method.</p>
          <p>→ Requests are reviewed and paid out by our team — most land <strong className="text-[var(--ink)]">the same day</strong>, weekends can take a little longer.</p>
          <p>→ Request a withdrawal <strong className="text-[var(--ink)]">anytime, 24/7</strong> — no fixed payout cycle to wait for.</p>
          <p>→ <strong className="text-[var(--ink)]">5 payout methods</strong> supported: PayPal, Payoneer, Bank transfer, USDT, UPI.</p>
        </div>
      </main>
      <StaticFooter />
    </>
  );
}
