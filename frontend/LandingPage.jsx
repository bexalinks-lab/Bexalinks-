// LandingPage.jsx
// Public marketing page for Bexalink — Next.js + Tailwind.
// Shares Dashboard.jsx's design language: near-black charcoal surface,
// hairline dividers instead of card shadows, serif-italic wordmark, and the
// cream -> peach -> pink brand gradient reserved for the wordmark and exactly
// one call-to-action per section, so it reads as a signature rather than
// decoration repeated on every element.
//
// Drop into a Next.js app as app/page.jsx (or pages/index.jsx) alongside
// Dashboard.jsx. Needs lucide-react (already a Dashboard dependency).

import { useState } from 'react';
import {
  Link2, ShieldCheck, Wallet, Users, Gauge, Globe2,
  ArrowRight, Copy, Check,
} from 'lucide-react';

const BRAND_GRADIENT = 'bg-gradient-to-r from-[#F7E9B9] via-[#F6C9A0] to-[#F6A8E0]';

function Wordmark({ size = 'text-2xl' }) {
  return (
    <span className={`${size} font-serif italic ${BRAND_GRADIENT} bg-clip-text text-transparent`}>
      Bexalink
    </span>
  );
}

function Nav() {
  return (
    <header className="flex items-center justify-between px-6 sm:px-10 py-6 max-w-6xl mx-auto">
      <Wordmark />
      <nav className="hidden md:flex items-center gap-8 text-sm text-white/50">
        <a href="#how-it-works" className="hover:text-white/80 transition-colors">How it works</a>
        <a href="#rates" className="hover:text-white/80 transition-colors">Rates</a>
        <a href="#payouts" className="hover:text-white/80 transition-colors">Payouts</a>
      </nav>
      <div className="flex items-center gap-4 text-sm">
        <a href="/login" className="text-white/60 hover:text-white/90 transition-colors">Sign in</a>
        <a href="/signup"
           className={`px-4 py-2 rounded-md font-medium text-black ${BRAND_GRADIENT}`}>
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
    <div className="border border-white/10 rounded-lg p-2 flex flex-col sm:flex-row gap-2 max-w-xl">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste a long link to shorten and monetize"
        className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
      />
      <button
        onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        className={`px-5 py-2.5 rounded-md text-sm font-medium text-black ${BRAND_GRADIENT} flex items-center justify-center gap-2`}
      >
        {copied ? <>Ready <Check size={15} /></> : <>Shorten <ArrowRight size={15} /></>}
      </button>
    </div>
  );
}

function HeroStat({ label, value, sublabel }) {
  return (
    <div className="flex-1 py-5 px-6 border-r border-white/10 last:border-r-0">
      <p className="text-xs text-white/40 mb-2">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
      {sublabel && <p className="text-xs text-white/35 mt-1">{sublabel}</p>}
    </div>
  );
}

function Hero() {
  return (
    <section className="px-6 sm:px-10 max-w-6xl mx-auto pt-8 pb-20 grid lg:grid-cols-2 gap-14 items-center">
      <div>
        <h1 className="font-serif italic text-4xl sm:text-5xl leading-[1.1] text-white mb-6">
          Every link you share can pay you back.
        </h1>
        <p className="text-white/50 text-base sm:text-lg mb-8 max-w-md">
          Bexalink shortens your links and pays you per verified view — real
          visitors only, filtered by the same fraud checks ad networks use,
          with earnings you can withdraw the same day.
        </p>
        <HeroShortenBar />
        <p className="text-xs text-white/30 mt-4">No credit card. First payout available at $5.</p>
      </div>

      <div className="border border-white/10 rounded-lg overflow-hidden">
        <div className="flex border-b border-white/10">
          <HeroStat label="Avg. CPM" value="$4.80" sublabel="Tier-1 traffic" />
          <HeroStat label="Payout time" value="< 24h" />
        </div>
        <div className="flex">
          <HeroStat label="Referral share" value="10%" sublabel="For the life of the account" />
          <HeroStat label="Payout methods" value="15+" />
        </div>
      </div>
    </section>
  );
}

function Step({ n, title, children }) {
  return (
    <div className="flex gap-5">
      <div className="shrink-0 w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-sm text-white/60">
        {n}
      </div>
      <div>
        <h3 className="text-white text-base font-medium mb-1.5">{title}</h3>
        <p className="text-white/45 text-sm leading-relaxed max-w-sm">{children}</p>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 sm:px-10 max-w-6xl mx-auto py-20 border-t border-white/10">
      <p className="text-white/40 text-sm mb-2">How it works</p>
      <h2 className="font-serif italic text-3xl text-white mb-12">From link to payout, three steps.</h2>
      <div className="grid sm:grid-cols-3 gap-10">
        <Step n="1" title="Shorten your link">
          Paste any destination URL into your dashboard or the API. Bexalink
          returns a short link in milliseconds.
        </Step>
        <Step n="2" title="Share it anywhere">
          Drop it into YouTube descriptions, forums, Telegram — wherever your
          audience already is.
        </Step>
        <Step n="3" title="Get paid per view">
          Each verified visit is checked for bots, VPNs, and duplicate clicks,
          then credited to your balance at your country's CPM rate.
        </Step>
      </div>
    </section>
  );
}

function FeatureRow({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-4 py-6 border-b border-white/10 last:border-0">
      <Icon size={20} strokeWidth={1.5} className="text-white/50 shrink-0 mt-0.5" />
      <div>
        <h3 className="text-white text-sm font-medium mb-1">{title}</h3>
        <p className="text-white/40 text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function Features() {
  return (
    <section className="px-6 sm:px-10 max-w-6xl mx-auto py-20 border-t border-white/10 grid lg:grid-cols-2 gap-x-16">
      <div className="mb-10 lg:mb-0">
        <p className="text-white/40 text-sm mb-2">Why publishers stay</p>
        <h2 className="font-serif italic text-3xl text-white mb-6 max-w-sm">
          Built on the parts of ad monetization people usually complain about.
        </h2>
        <p className="text-white/45 text-sm leading-relaxed max-w-sm">
          Every feature below exists because a publisher asked for it —
          faster payouts, real fraud filtering, and rates that don't quietly
          drift down over time.
        </p>
      </div>
      <div>
        <FeatureRow icon={Gauge} title="Rates that hold">
          CPM is resolved per country and cached, not renegotiated against you
          after your traffic ramps up.
        </FeatureRow>
        <FeatureRow icon={ShieldCheck} title="Fraud filtered before it's counted">
          Bot signatures, VPNs, proxies, and datacenter traffic are screened
          out before a view ever reaches your earnings — not after a payout
          clawback.
        </FeatureRow>
        <FeatureRow icon={Wallet} title="Same-day payouts">
          Request a withdrawal and it's processed within the day, not held
          for a weekly batch.
        </FeatureRow>
        <FeatureRow icon={Users} title="10% for life, not 30 days">
          Refer another publisher and earn a share of their earnings for as
          long as their account is active.
        </FeatureRow>
      </div>
    </section>
  );
}

function RateRow({ country, cpm }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/10 last:border-0 text-sm">
      <span className="text-white/70">{country}</span>
      <span className="text-white/90 font-medium">${cpm.toFixed(2)}</span>
    </div>
  );
}

function Rates() {
  return (
    <section id="rates" className="px-6 sm:px-10 max-w-6xl mx-auto py-20 border-t border-white/10 grid lg:grid-cols-2 gap-14 items-start">
      <div>
        <p className="text-white/40 text-sm mb-2">Sample rates</p>
        <h2 className="font-serif italic text-3xl text-white mb-6">Priced by where your viewer is, not a flat average.</h2>
        <p className="text-white/45 text-sm leading-relaxed max-w-sm">
          Rates below are current per-1,000-view averages. Your dashboard
          shows the live rate for every country sending you traffic.
        </p>
      </div>
      <div className="border border-white/10 rounded-lg px-6 py-2">
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
    <section className="px-6 sm:px-10 max-w-6xl mx-auto py-20 border-t border-white/10">
      <div className="max-w-2xl">
        <p className="font-serif italic text-2xl text-white/90 leading-snug mb-6">
          "I moved my whole Telegram audience over about four months ago.
          Payouts have landed on time every single week since."
        </p>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10" />
          <div>
            <p className="text-sm text-white/80">Priya Nair</p>
            <p className="text-xs text-white/40">Independent publisher</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Payouts() {
  const methods = ['PayPal', 'Payoneer', 'Bank transfer', 'USDT', 'UPI', 'Wise'];
  return (
    <section id="payouts" className="px-6 sm:px-10 max-w-6xl mx-auto py-20 border-t border-white/10">
      <p className="text-white/40 text-sm mb-2">Payouts</p>
      <h2 className="font-serif italic text-3xl text-white mb-10">Fifteen ways to get paid, worldwide.</h2>
      <div className="flex flex-wrap gap-x-10 gap-y-4">
        {methods.map((m) => (
          <span key={m} className="text-white/60 text-sm flex items-center gap-2">
            <Globe2 size={15} className="text-white/30" /> {m}
          </span>
        ))}
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="px-6 sm:px-10 max-w-6xl mx-auto py-20 border-t border-white/10 text-center">
      <h2 className="font-serif italic text-3xl sm:text-4xl text-white mb-4">
        Your next link could be your first payout.
      </h2>
      <p className="text-white/45 mb-8">Free to join. No minimum traffic required.</p>
      <a href="/signup"
         className={`inline-flex items-center gap-2 px-6 py-3 rounded-md font-medium text-black ${BRAND_GRADIENT}`}>
        Create your account <ArrowRight size={16} />
      </a>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 sm:px-10 max-w-6xl mx-auto py-12 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-6 text-sm text-white/35">
      <div>
        <Wordmark size="text-lg" />
        <p className="mt-2 max-w-xs text-white/30">Shorten, share, and earn from every link you send out.</p>
      </div>
      <div className="flex gap-10">
        <div className="flex flex-col gap-2">
          <span className="text-white/50 mb-1">Product</span>
          <a href="#how-it-works" className="hover:text-white/60">How it works</a>
          <a href="#rates" className="hover:text-white/60">Rates</a>
          <a href="#payouts" className="hover:text-white/60">Payouts</a>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-white/50 mb-1">Company</span>
          <a href="/about" className="hover:text-white/60">About</a>
          <a href="/contact" className="hover:text-white/60">Contact</a>
          <a href="/dmca" className="hover:text-white/60">DMCA</a>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0B0A0C] text-white">
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
