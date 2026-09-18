'use client';
// LandingPage.jsx
// Public marketing page for Bexalink — "Liquid Glass" design language:
// frosted translucent panels floating over a soft gradient-blob backdrop
// (see app/globals.css for the fixed background + .glass utilities),
// gradient icon badges with a glossy highlight for a 3D-widget feel, and a
// bold rounded display face instead of the earlier ledger/serif treatment.

import { useState } from 'react';
import {
  ArrowRight, Globe2, Link2, ShieldCheck, Wallet, Users, Copy, Zap, TrendingUp,
} from 'lucide-react';
import { LOGO_DATA_URI } from './logo-data';

const BRAND_GRADIENT = 'bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500';
// A punchier, distinct gradient just for primary action buttons — warm
// fuchsia into deep violet — plus a colored glow shadow and a glossy
// highlight so the CTA reads as a raised, glassy 3D pill.
const CTA_GRADIENT = 'bg-gradient-to-r from-orange-400 via-fuchsia-500 to-indigo-600';
const CTA_SHADOW = { boxShadow: '0 10px 30px -6px rgba(217, 70, 239, 0.55)' };

function CtaButton({ children, className = '', ...props }) {
  const Comp = props.href ? 'a' : 'button';
  return (
    <Comp
      {...props}
      style={CTA_SHADOW}
      className={`relative overflow-hidden ${CTA_GRADIENT} text-white font-body font-semibold ${className}`}
    >
      <span className="glass-shine" style={{ width: '45%', height: '35%' }} />
      <span className="relative z-10 flex items-center justify-center gap-2 whitespace-nowrap">{children}</span>
    </Comp>
  );
}

function Wordmark({ className = 'h-8', dark = false }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={LOGO_DATA_URI} alt="Bexalink" className={`${className} w-auto object-contain`} />
  );
  if (!dark) return img;
  // The logo's gradient text was designed for a dark backdrop, so give it
  // a small dark chip of its own wherever it sits on the light glass UI.
  return (
    <span className="bg-[#0B0A12] rounded-xl px-3 py-1.5 flex items-center shrink-0">
      {img}
    </span>
  );
}

// Soft, large blurred gradient glow blobs — used only inside the footer
// band as background texture. Pure color glow (no icon glyphs inside),
// since a visible stroke edge through heavy blur reads as a stray line.
function FooterIcons() {
  const blobs = [
    { gradient: 'from-indigo-400 to-violet-500', style: { top: '-30%', left: '2%' }, size: 220 },
    { gradient: 'from-sky-300 to-cyan-500', style: { top: '0%', right: '4%' }, size: 240 },
    { gradient: 'from-pink-300 to-rose-500', style: { bottom: '-35%', left: '35%' }, size: 200 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10" aria-hidden="true">
      {blobs.map(({ gradient, style, size }, i) => (
        <div
          key={i}
          className={`absolute rounded-full bg-gradient-to-br ${gradient} opacity-[0.14] blur-3xl`}
          style={{ ...style, width: size, height: size }}
        />
      ))}
    </div>
  );
}

// A gradient, glossy circular icon badge — the "3D widget icon" motif from
// the reference boards, reused everywhere an icon appears.
function IconBadge({ icon: Icon, gradient, size = 44 }) {
  return (
    <div
      className={`relative shrink-0 rounded-2xl ${gradient} flex items-center justify-center shadow-lg overflow-hidden`}
      style={{ width: size, height: size }}
    >
      <div className="glass-shine" />
      <Icon size={size * 0.46} strokeWidth={2} className="text-white relative z-10" />
    </div>
  );
}

function Nav() {
  return (
    <header className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-5xl mx-auto">
      <div className="glass rounded-full pl-2 pr-2 py-2 flex items-center gap-3 sm:gap-8 w-full sm:w-auto justify-between">
        <Wordmark className="h-6 sm:h-7" dark />
        <nav className="hidden md:flex items-center gap-6 text-sm font-body font-medium text-[var(--ink-soft)]">
          <a href="#how-it-works" className="hover:text-[var(--ink)] transition-colors">How it works</a>
          <a href="#rates" className="hover:text-[var(--ink)] transition-colors">Rates</a>
          <a href="#payouts" className="hover:text-[var(--ink)] transition-colors">Payouts</a>
        </nav>
        <CtaButton href="/signup" className="px-4 py-2 sm:px-5 rounded-full text-xs sm:text-sm whitespace-nowrap shrink-0">
          Get started
        </CtaButton>
      </div>
    </header>
  );
}

function HeroShortenBar() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function shorten() {
    if (!url || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationUrl: url }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.shortUrl);
      } else {
        setError(data.error || 'Could not shorten that link. Sign in and try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="glass-strong rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-lg">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a link to shorten and monetize"
          className="flex-1 bg-transparent px-4 py-3 text-sm font-body text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none"
        />
        <CtaButton onClick={shorten} disabled={busy} className="px-6 py-3 rounded-xl text-sm disabled:opacity-60">
          {busy ? 'Shortening…' : <>Shorten <ArrowRight size={15} /></>}
        </CtaButton>
      </div>
      {result && (
        <div className="mt-3 flex items-center gap-2 text-sm font-body text-[var(--ink-soft)]">
          <a href={result} target="_blank" rel="noopener noreferrer" className="underline">{result}</a>
          <button onClick={() => navigator.clipboard.writeText(result)} className="text-[var(--ink-faint)] hover:text-[var(--ink-soft)]">
            <Copy size={14} />
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-sm font-body text-rose-600">{error}</p>}
    </div>
  );
}

function WidgetStat({ label, value, sublabel, gradient }) {
  return (
    <div className={`glass rounded-3xl p-5 relative overflow-hidden`}>
      <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full ${gradient} opacity-30 blur-2xl`} />
      <p className="text-xs font-body font-medium text-[var(--ink-faint)] mb-2 relative z-10">{label}</p>
      <p className="font-display font-bold text-3xl text-[var(--ink)] relative z-10">{value}</p>
      {sublabel && <p className="text-xs font-body text-[var(--ink-faint)] mt-1 relative z-10">{sublabel}</p>}
    </div>
  );
}

// Big glossy 3D icon badges scattered behind the headline — link/money
// themed, kept behind the text (-z-10) so they peek through the gaps
// around the bold letters rather than sit on top of them.
function HeroIcons() {
  const icons = [
    { Icon: Link2, gradient: 'from-indigo-400 to-violet-600', style: { top: '-4%', right: '2%' }, size: 68, rotate: -14 },
    { Icon: Zap, gradient: 'from-amber-300 to-orange-500', style: { top: '20%', right: '20%' }, size: 46, rotate: 16 },
    { Icon: TrendingUp, gradient: 'from-emerald-300 to-teal-500', style: { top: '38%', right: '4%' }, size: 58, rotate: 10 },
    { Icon: Wallet, gradient: 'from-pink-400 to-rose-500', style: { top: '58%', right: '24%' }, size: 50, rotate: -12 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {icons.map(({ Icon, gradient, style, size, rotate }, i) => (
        <div
          key={i}
          className={`absolute flex items-center justify-center rounded-3xl bg-gradient-to-br ${gradient} shadow-xl opacity-95`}
          style={{ ...style, width: size, height: size, transform: `rotate(${rotate}deg)` }}
        >
          <div className="glass-shine" />
          <Icon size={size * 0.48} strokeWidth={2} className="text-white relative z-10" />
        </div>
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section className="relative px-6 sm:px-10 max-w-5xl mx-auto pt-10 pb-20">
      <HeroIcons />
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
        <div className="relative">
          <h1 className="font-display font-extrabold text-[2.6rem] sm:text-5xl leading-[1.08] text-[var(--ink)] mb-6">
            Every link you share can pay you back.
          </h1>
          <p className="font-body text-[var(--ink-soft)] text-base sm:text-lg mb-8 max-w-md leading-relaxed">
            Bexalink shortens your links and credits your balance per
            verified view — real visitors only, checked the way ad networks
            check them, with payouts you can request the same day.
          </p>
          <HeroShortenBar />
          <p className="text-xs font-body text-[var(--ink-faint)] mt-4">No card required. First payout available at $5.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <WidgetStat label="Avg. CPM" value="$4.80" sublabel="Tier-1 traffic" gradient="bg-indigo-500" />
          <WidgetStat label="Payout time" value="< 24h" gradient="bg-pink-500" />
          <WidgetStat label="Referral share" value="10%" sublabel="For life" gradient="bg-sky-400" />
          <WidgetStat label="Payout methods" value="15+" gradient="bg-violet-500" />
        </div>
      </div>
    </section>
  );
}

function Step({ n, icon: Icon, gradient, title, children }) {
  return (
    <div className="glass rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <IconBadge icon={Icon} gradient={gradient} />
        <span className="font-display font-bold text-2xl text-[var(--ink-faint)]">{n}</span>
      </div>
      <div>
        <h3 className="font-body text-[var(--ink)] text-base font-bold mb-1.5">{title}</h3>
        <p className="font-body text-[var(--ink-soft)] text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 sm:px-10 max-w-5xl mx-auto py-10">
      <h2 className="font-display font-bold text-3xl text-[var(--ink)] mb-2">From link to payout, three steps.</h2>
      <p className="font-body text-[var(--ink-soft)] mb-8 max-w-md">Shorten it, share it, get paid for it.</p>
      <div className="grid sm:grid-cols-3 gap-5">
        <Step n="01" icon={Link2} gradient="bg-gradient-to-br from-indigo-400 to-indigo-600" title="Shorten your link">
          Paste any destination URL into your dashboard or the API. Bexalink
          returns a short link instantly.
        </Step>
        <Step n="02" icon={Globe2} gradient="bg-gradient-to-br from-sky-400 to-cyan-500" title="Share it anywhere">
          Drop it into a video description, a forum post, a Telegram
          channel — wherever your audience already is.
        </Step>
        <Step n="03" icon={Wallet} gradient="bg-gradient-to-br from-pink-400 to-rose-500" title="Get paid per view">
          Each visit is checked for bots and duplicates, then credited to
          your balance at your country's rate.
        </Step>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, gradient, title, children }) {
  return (
    <div className="glass rounded-3xl p-6 flex gap-4">
      <IconBadge icon={Icon} gradient={gradient} />
      <div>
        <h3 className="font-body text-[var(--ink)] text-sm font-bold mb-1.5">{title}</h3>
        <p className="font-body text-[var(--ink-soft)] text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function Features() {
  return (
    <section className="px-6 sm:px-10 max-w-5xl mx-auto py-10">
      <div className="mb-8 max-w-lg">
        <h2 className="font-display font-bold text-3xl text-[var(--ink)] mb-3">
          Built on the parts of ad monetization people complain about most.
        </h2>
        <p className="font-body text-[var(--ink-soft)] text-sm leading-relaxed">
          Every feature below exists because a publisher asked for it —
          rates that hold, fraud caught before it's counted, and payouts
          that don't wait for a batch.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <FeatureCard icon={ShieldCheck} gradient="bg-gradient-to-br from-violet-400 to-purple-600" title="Fraud filtered before it's counted">
          Bots, VPNs, proxies, and datacenter traffic are screened out
          before a view reaches your earnings.
        </FeatureCard>
        <FeatureCard icon={Wallet} gradient="bg-gradient-to-br from-pink-400 to-rose-500" title="Same-day payouts">
          Request a withdrawal and it's processed the same day, not held
          for a weekly cycle.
        </FeatureCard>
        <FeatureCard icon={Users} gradient="bg-gradient-to-br from-sky-400 to-blue-500" title="10% for life, not 30 days">
          Refer another publisher and earn a share of their earnings for as
          long as their account stays active.
        </FeatureCard>
        <FeatureCard icon={Link2} gradient="bg-gradient-to-br from-indigo-400 to-indigo-600" title="Rates that hold">
          CPM is resolved per country and cached, not renegotiated against
          you once your traffic ramps up.
        </FeatureCard>
      </div>
    </section>
  );
}

function RateRow({ country, cpm }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/40 last:border-0">
      <span className="font-body text-sm text-[var(--ink)]">{country}</span>
      <span className="font-display font-semibold text-sm text-[var(--ink)]">${cpm.toFixed(2)}</span>
    </div>
  );
}

function Rates() {
  return (
    <section id="rates" className="px-6 sm:px-10 max-w-5xl mx-auto py-10 grid lg:grid-cols-2 gap-10 items-start">
      <div>
        <h2 className="font-display font-bold text-3xl text-[var(--ink)] mb-3">Priced by where your viewer is.</h2>
        <p className="font-body text-[var(--ink-soft)] text-sm leading-relaxed max-w-sm">
          The figures below are current per-1,000-view averages. Your
          dashboard shows the live rate for every country sending you
          traffic.
        </p>
      </div>
      <div className="glass rounded-3xl px-6 py-2">
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
    <section className="px-6 sm:px-10 max-w-5xl mx-auto py-10">
      <div className="glass-strong rounded-3xl p-8 max-w-xl">
        <p className="font-display font-medium text-2xl text-[var(--ink)] leading-snug mb-5">
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
    <section id="payouts" className="px-6 sm:px-10 max-w-5xl mx-auto py-10 relative">
      <div className="absolute top-0 left-1/4 w-56 h-56 rounded-full bg-gradient-to-br from-sky-300 to-indigo-400 opacity-20 blur-3xl -z-10" />
      <h2 className="font-display font-bold text-3xl text-[var(--ink)] mb-6">Fifteen ways to get paid, worldwide.</h2>
      <div className="flex flex-wrap gap-3">
        {methods.map((m) => (
          <span key={m} className="glass rounded-full px-4 py-2 font-body text-sm text-[var(--ink-soft)]">
            {m}
          </span>
        ))}
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="px-6 sm:px-10 max-w-5xl mx-auto py-16 flex justify-center">
      <div className="relative w-full max-w-sm p-7 overflow-hidden glass-strong" style={{ borderRadius: 40 }}>
        {/* soft interior gradient wash, like the reference profile card */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-200/70 via-sky-100/50 to-pink-100/60" />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 opacity-30 blur-2xl -z-10" />

        <div className="flex items-start justify-between mb-5">
          <div className={`w-14 h-14 rounded-2xl ${BRAND_GRADIENT} flex items-center justify-center shadow-lg relative overflow-hidden`}>
            <div className="glass-shine" />
            <Wallet size={26} className="text-white relative z-10" />
          </div>
          <span className="w-9 h-9 rounded-full glass flex items-center justify-center">
            <ArrowRight size={15} className="text-[var(--ink-soft)]" />
          </span>
        </div>

        <h2 className="font-display font-bold text-2xl text-[var(--ink)] mb-1">Create your account</h2>
        <p className="font-body text-sm text-[var(--ink-soft)] mb-5">Free to join. No minimum traffic required.</p>

        <div className="flex gap-2 mb-6">
          <span className="glass rounded-full px-3 py-1 text-xs font-body text-[var(--ink-soft)]">Instant payouts</span>
          <span className="glass rounded-full px-3 py-1 text-xs font-body text-[var(--ink-soft)]">15+ countries</span>
        </div>

        <div className="flex items-center justify-between mb-6 text-center">
          <div>
            <p className="font-display font-bold text-lg text-[var(--ink)]">$4.80</p>
            <p className="text-xs font-body text-[var(--ink-faint)]">Avg. CPM</p>
          </div>
          <div>
            <p className="font-display font-bold text-lg text-[var(--ink)]">10%</p>
            <p className="text-xs font-body text-[var(--ink-faint)]">Referral</p>
          </div>
          <div>
            <p className="font-display font-bold text-lg text-[var(--ink)]">&lt;24h</p>
            <p className="text-xs font-body text-[var(--ink-faint)]">Payout</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CtaButton href="/signup" className="flex-1 text-center px-5 py-3 rounded-full text-sm">
            Get started
          </CtaButton>
          <a href="/login" className="w-11 h-11 shrink-0 rounded-full glass flex items-center justify-center">
            <ArrowRight size={16} className="text-[var(--ink-soft)]" />
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative overflow-hidden">
      <FooterIcons />
      <div className="px-6 sm:px-10 max-w-5xl mx-auto py-10 flex flex-col sm:flex-row justify-between gap-6 text-sm font-body text-[var(--ink-faint)]">
        <div>
          <Wordmark className="h-5" dark />
          <p className="mt-2 max-w-xs">Shorten, share, and get paid from every link you send out.</p>
        </div>
        <div className="flex gap-10">
          <div className="flex flex-col gap-2">
            <span className="text-[var(--ink-soft)] mb-1 font-semibold">Product</span>
            <a href="#how-it-works" className="hover:text-[var(--ink-soft)]">How it works</a>
            <a href="#rates" className="hover:text-[var(--ink-soft)]">Rates</a>
            <a href="#payouts" className="hover:text-[var(--ink-soft)]">Payouts</a>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[var(--ink-soft)] mb-1 font-semibold">Company</span>
            <a href="/about" className="hover:text-[var(--ink-soft)]">About</a>
            <a href="/contact" className="hover:text-[var(--ink-soft)]">Contact</a>
            <a href="/dmca" className="hover:text-[var(--ink-soft)]">DMCA</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
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
