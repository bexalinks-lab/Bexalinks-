'use client';
// LandingPage.jsx
// Public marketing page for Bexalink.
//
// Design concept: Bexalink pays people per view, so the page is built like
// a ledger / payout statement rather than a generic dark SaaS page — paper
// background, ink-green text, one emerald accent for action, tabular
// monospace numerals for every dollar figure so money always reads like
// money. Rows and hairline rules stand in for cards; nothing gets a drop
// shadow. The three-step section is numbered because it genuinely is a
// sequence — nothing else on the page is.
//
// Drop into a Next.js app as app/page.jsx alongside Dashboard.jsx.
// Needs lucide-react (already a Dashboard dependency).

import { useState } from 'react';
import { ArrowRight, Check, Globe2 } from 'lucide-react';

function Wordmark({ className = 'text-xl' }) {
  return (
    <span className={`font-display italic text-[var(--ink)] ${className}`}>
      Bexalink
    </span>
  );
}

function Nav() {
  return (
    <header className="flex items-center justify-between px-6 sm:px-10 py-6 max-w-5xl mx-auto">
      <Wordmark />
      <nav className="hidden md:flex items-center gap-8 text-sm font-body text-[var(--ink-soft)]">
        <a href="#how-it-works" className="hover:text-[var(--ink)] transition-colors">How it works</a>
        <a href="#rates" className="hover:text-[var(--ink)] transition-colors">Rates</a>
        <a href="#payouts" className="hover:text-[var(--ink)] transition-colors">Payouts</a>
      </nav>
      <div className="flex items-center gap-5 text-sm font-body">
        <a href="/login" className="text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">Sign in</a>
        <a href="/signup" className="px-4 py-2 rounded bg-[var(--green)] text-white hover:bg-[var(--green-deep)] transition-colors">
          Get started
        </a>
      </div>
    </header>
  );
}

function HeroShortenBar() {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  return (
    <div className="border border-[var(--line)] rounded bg-[var(--surface)] p-1.5 flex flex-col sm:flex-row gap-1.5 max-w-lg">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste a link to shorten and monetize"
        className="flex-1 bg-transparent px-3 py-2.5 text-sm font-body text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none"
      />
      <button
        onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className="px-5 py-2.5 rounded bg-[var(--green)] text-white text-sm font-body font-medium hover:bg-[var(--green-deep)] transition-colors flex items-center justify-center gap-2"
      >
        {copied ? <>Ready <Check size={15} /></> : <>Shorten <ArrowRight size={15} /></>}
      </button>
    </div>
  );
}

function LedgerLine({ label, value, sub }) {
  return (
    <div className="flex items-baseline justify-between py-3 border-b border-[var(--line)] last:border-0">
      <span className="text-sm font-body text-[var(--ink-soft)]">{label}</span>
      <span className="text-right">
        <span className="font-ledger text-base text-[var(--ink)]">{value}</span>
        {sub && <span className="block text-xs font-body text-[var(--ink-faint)] mt-0.5">{sub}</span>}
      </span>
    </div>
  );
}

function Hero() {
  return (
    <section className="px-6 sm:px-10 max-w-5xl mx-auto pt-6 pb-20 grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-start">
      <div>
        <h1 className="font-display text-[2.75rem] sm:text-5xl leading-[1.08] text-[var(--ink)] mb-6">
          Every link is a line item you get paid for.
        </h1>
        <p className="font-body text-[var(--ink-soft)] text-base sm:text-lg mb-8 max-w-md leading-relaxed">
          Bexalink shortens your links and credits your balance per verified
          view — real visitors only, checked the way ad networks check them,
          with payouts you can request the same day.
        </p>
        <HeroShortenBar />
        <p className="text-xs font-body text-[var(--ink-faint)] mt-4">No card required. First payout available at $5.</p>
      </div>

      <div className="bg-[var(--surface)] border border-[var(--line)] rounded px-6 py-2">
        <p className="text-xs font-body uppercase tracking-wide text-[var(--ink-faint)] pt-4 pb-1">This month, average account</p>
        <LedgerLine label="Verified views" value="18,240" />
        <LedgerLine label="Blended CPM" value="$3.90" sub="varies by viewer country" />
        <LedgerLine label="Referral credit" value="$14.02" sub="10% of referred earnings" />
        <LedgerLine label="Balance available" value="$71.16" sub="withdrawable now" />
      </div>
    </section>
  );
}

function Step({ n, title, children }) {
  return (
    <div className="border-t border-[var(--line)] py-7 grid sm:grid-cols-[3rem_1fr] gap-3 sm:gap-8">
      <span className="font-ledger text-sm text-[var(--ink-faint)]">{n}</span>
      <div>
        <h3 className="font-body text-[var(--ink)] text-base font-medium mb-1.5">{title}</h3>
        <p className="font-body text-[var(--ink-soft)] text-sm leading-relaxed max-w-md">{children}</p>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 sm:px-10 max-w-5xl mx-auto py-16">
      <h2 className="font-display italic text-3xl text-[var(--ink)] mb-2">From link to payout.</h2>
      <p className="font-body text-[var(--ink-soft)] max-w-md mb-2">Three steps, in order, every time.</p>
      <div>
        <Step n="01" title="Shorten your link">
          Paste any destination URL into your dashboard or the API. Bexalink
          returns a short link immediately.
        </Step>
        <Step n="02" title="Share it anywhere">
          Drop it into a video description, a forum post, a Telegram channel
          — wherever your audience already is.
        </Step>
        <Step n="03" title="Get paid per view">
          Each visit is checked for bots, VPNs, and duplicate clicks, then
          credited to your balance at your country's rate.
        </Step>
      </div>
    </section>
  );
}

function FeatureRow({ title, children }) {
  return (
    <div className="py-6 border-b border-[var(--line)] last:border-0">
      <h3 className="font-body text-[var(--ink)] text-sm font-medium mb-1.5">{title}</h3>
      <p className="font-body text-[var(--ink-soft)] text-sm leading-relaxed max-w-md">{children}</p>
    </div>
  );
}

function Features() {
  return (
    <section className="px-6 sm:px-10 max-w-5xl mx-auto py-16 border-t border-[var(--line)] grid lg:grid-cols-2 gap-x-16">
      <div className="mb-8 lg:mb-0">
        <h2 className="font-display italic text-3xl text-[var(--ink)] mb-4 max-w-sm">
          Built on the parts of ad monetization people complain about most.
        </h2>
        <p className="font-body text-[var(--ink-soft)] text-sm leading-relaxed max-w-sm">
          Every line below exists because a publisher asked for it — rates
          that hold, fraud caught before it's counted, and payouts that
          don't wait for a batch.
        </p>
      </div>
      <div>
        <FeatureRow title="Rates that hold">
          CPM is resolved per country and cached, not renegotiated against
          you once your traffic ramps up.
        </FeatureRow>
        <FeatureRow title="Fraud filtered before it's counted">
          Bots, VPNs, proxies, and datacenter traffic are screened out
          before a view reaches your earnings — not after a clawback.
        </FeatureRow>
        <FeatureRow title="Same-day payouts">
          Request a withdrawal and it's processed the same day, not held
          for a weekly cycle.
        </FeatureRow>
        <FeatureRow title="10% for life, not 30 days">
          Refer another publisher and earn a share of their earnings for as
          long as their account stays active.
        </FeatureRow>
      </div>
    </section>
  );
}

function RateRow({ country, cpm }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--line)] last:border-0">
      <span className="font-body text-sm text-[var(--ink)]">{country}</span>
      <span className="font-ledger text-sm text-[var(--ink)]">${cpm.toFixed(2)}</span>
    </div>
  );
}

function Rates() {
  return (
    <section id="rates" className="px-6 sm:px-10 max-w-5xl mx-auto py-16 border-t border-[var(--line)] grid lg:grid-cols-2 gap-14 items-start">
      <div>
        <h2 className="font-display italic text-3xl text-[var(--ink)] mb-4">Priced by where your viewer is.</h2>
        <p className="font-body text-[var(--ink-soft)] text-sm leading-relaxed max-w-sm">
          The figures below are current per-1,000-view averages. Your
          dashboard shows the live rate for every country sending you
          traffic.
        </p>
      </div>
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded px-6">
        <RateRow country="United States" cpm={6.2} />
        <RateRow country="United Kingdom" cpm={5.4} />
        <RateRow country="Germany" cpm={5.1} />
        <RateRow country="India" cpm={1.3} />
        <RateRow country="Brazil" cpm={1.6} />
        <RateRow country="Global average" cpm={2.9} />
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section className="px-6 sm:px-10 max-w-5xl mx-auto py-16 border-t border-[var(--line)]">
      <div className="max-w-xl">
        <p className="font-display italic text-2xl text-[var(--ink)] leading-snug mb-5">
          I moved my whole Telegram audience over about four months ago.
          Payouts have landed on time every week since.
        </p>
        <p className="font-body text-sm text-[var(--ink-soft)]">Priya Nair — independent publisher</p>
      </div>
    </section>
  );
}

function Payouts() {
  const methods = ['PayPal', 'Payoneer', 'Bank transfer', 'USDT', 'UPI', 'Wise'];
  return (
    <section id="payouts" className="px-6 sm:px-10 max-w-5xl mx-auto py-16 border-t border-[var(--line)]">
      <h2 className="font-display italic text-3xl text-[var(--ink)] mb-8">Fifteen ways to get paid, worldwide.</h2>
      <div className="flex flex-wrap gap-x-10 gap-y-4">
        {methods.map((m) => (
          <span key={m} className="font-body text-sm text-[var(--ink-soft)] flex items-center gap-2">
            <Globe2 size={15} className="text-[var(--ink-faint)]" /> {m}
          </span>
        ))}
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="px-6 sm:px-10 max-w-5xl mx-auto py-20 border-t border-[var(--line)]">
      <h2 className="font-display italic text-3xl sm:text-4xl text-[var(--ink)] mb-3 max-w-lg">
        Your next link could be your first payout.
      </h2>
      <p className="font-body text-[var(--ink-soft)] mb-8">Free to join. No minimum traffic required.</p>
      <a href="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[var(--green)] text-white font-body font-medium hover:bg-[var(--green-deep)] transition-colors">
        Create your account <ArrowRight size={16} />
      </a>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 sm:px-10 max-w-5xl mx-auto py-12 border-t border-[var(--line)] flex flex-col sm:flex-row justify-between gap-6 text-sm font-body text-[var(--ink-faint)]">
      <div>
        <Wordmark className="text-lg" />
        <p className="mt-2 max-w-xs">Shorten, share, and get paid from every link you send out.</p>
      </div>
      <div className="flex gap-10">
        <div className="flex flex-col gap-2">
          <span className="text-[var(--ink-soft)] mb-1">Product</span>
          <a href="#how-it-works" className="hover:text-[var(--ink-soft)]">How it works</a>
          <a href="#rates" className="hover:text-[var(--ink-soft)]">Rates</a>
          <a href="#payouts" className="hover:text-[var(--ink-soft)]">Payouts</a>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[var(--ink-soft)] mb-1">Company</span>
          <a href="/about" className="hover:text-[var(--ink-soft)]">About</a>
          <a href="/contact" className="hover:text-[var(--ink-soft)]">Contact</a>
          <a href="/dmca" className="hover:text-[var(--ink-soft)]">DMCA</a>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <Nav />
      <Hero />
      <HowItWorks />
      <Features />
      <Rates />
      <Testimonial />
      <Payouts />
      <ClosingCTA />
      <Footer />
    </div>
  );
}
