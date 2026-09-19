import { StaticHeader, StaticFooter } from '../../frontend/StaticPageChrome';

export const metadata = {
  title: 'About — Bexalink',
  description: 'Bexalink is a Bexa Network product that turns every link you share into an income stream.',
};

export default function AboutPage() {
  return (
    <>
      <StaticHeader />
      <main className="px-6 sm:px-10 py-14 max-w-3xl mx-auto">
        <div className="relative p-7 sm:p-10 overflow-hidden glass-strong" style={{ borderRadius: 40 }}>
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-200/60 via-sky-100/40 to-pink-100/50" />

          <h1 className="font-display font-bold text-3xl sm:text-4xl text-[var(--ink)] mb-4">About Bexalink</h1>

          <p className="font-body text-[var(--ink-soft)] leading-relaxed mb-4">
            Bexalink is a link-shortening and monetization platform built by Bexa Network. Every day, millions
            of links get shared across social media, forums, and messaging apps — and almost none of that
            traffic ever pays the person sharing it. Bexalink was built to change that: shorten a link, share it
            the way you normally would, and earn a small payout every time a real visitor opens it.
          </p>

          <p className="font-body text-[var(--ink-soft)] leading-relaxed mb-4">
            We work the same way established ad networks do — every view is checked for authenticity before
            it&apos;s credited, so payouts reflect real human traffic rather than bots or repeat clicks. That keeps
            payouts fair for publishers and keeps the network trustworthy for advertisers.
          </p>

          <p className="font-body text-[var(--ink-soft)] leading-relaxed mb-4">
            Whether you run a blog, a YouTube channel, a Telegram group, or you just share links with friends,
            Bexalink turns your existing audience into a steady, transparent source of income — with no card
            required to get started and payouts available the same day you cross the minimum threshold.
          </p>

          <h2 className="font-display font-bold text-xl text-[var(--ink)] mt-8 mb-3">What we stand for</h2>
          <ul className="font-body text-[var(--ink-soft)] leading-relaxed list-disc pl-5 space-y-2">
            <li>Fair, transparent CPM rates with no hidden deductions.</li>
            <li>Fast payouts — request as soon as you hit the minimum balance.</li>
            <li>Real-traffic verification, so the network stays healthy for everyone.</li>
            <li>Support for publishers in 15+ countries and growing.</li>
          </ul>

          <p className="font-body text-[var(--ink-soft)] leading-relaxed mt-8">
            Have questions about how Bexalink works? Visit our{' '}
            <a href="/contact" className="text-[var(--ink)] font-medium underline">Contact</a> page — we&apos;re happy to help.
          </p>
        </div>
      </main>
      <StaticFooter />
    </>
  );
}
