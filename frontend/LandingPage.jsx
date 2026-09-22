'use client';
// LandingPage.jsx
// Public marketing page for Bexalink — "Liquid Glass" design language:
// frosted translucent panels floating over a soft gradient-blob backdrop
// (see app/globals.css for the fixed background + .glass utilities),
// gradient icon badges with a glossy highlight for a 3D-widget feel, and a
// bold rounded display face instead of the earlier ledger/serif treatment.

import { useEffect, useState } from 'react';
import {
  ArrowRight, Globe2, Landmark, Link2, Menu, ShieldCheck, Wallet, Users, Copy, X,
} from 'lucide-react';
import BrandLogo from './BrandLogo';

const BRAND_GRADIENT = 'bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500';
// Buttons — styles live in app/globals.css.
//   glass   : liquid-glass capsule with a soft gradient tint ("Get started")
//   shorten : black capsule with a rainbow ring, Montserrat ("Shorten")
//   solid   : plain black capsule
const BUTTON_VARIANTS = {
  glass: 'btn-glass font-body',
  shorten: 'btn-shorten', // brings its own Montserrat font
  solid: 'btn-primary font-body',
};

function CtaButton({ variant = 'glass', children, className = '', ...props }) {
  const Comp = props.href ? 'a' : 'button';
  return (
    <Comp {...props} className={`btn ${BUTTON_VARIANTS[variant]} ${className}`}>
      {children}
    </Comp>
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

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#rates', label: 'Rates' },
  { href: '#payouts', label: 'Payouts' },
];

function Nav() {
  const [open, setOpen] = useState(false);

  // Close the mobile menu with the Escape key.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-30 glass-strong" style={{ borderRadius: 0 }}>
      <div className="relative flex items-center justify-between gap-4 px-6 sm:px-10 py-4 max-w-5xl mx-auto">
        <BrandLogo href="/" />

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-body font-medium text-[var(--ink-soft)]">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-[var(--ink)] transition-colors">{l.label}</a>
          ))}
          <a href="/login" className="hover:text-[var(--ink)] transition-colors">Log in</a>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <CtaButton href="/signup" className="px-4 py-2 rounded-full text-[13px]">
            Get started
          </CtaButton>
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="btn btn-secondary md:hidden w-9 h-9 rounded-full"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <nav
            id="mobile-menu"
            className="md:hidden absolute right-6 sm:right-10 top-full mt-1 w-56 glass-strong rounded-3xl p-2 flex flex-col font-body text-sm font-medium text-[var(--ink)]"
          >
            {[...NAV_LINKS, { href: '/login', label: 'Log in' }].map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-2xl hover:bg-white/60 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}
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
    <div className="font-shorten max-w-md">
      {/* Shorten box: outlined container → centred pill input → rainbow-ring button */}
      <div className="shorten-box flex flex-col gap-5">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && shorten()}
          placeholder="Paste a link to shorten and monetize"
          aria-label="Link to shorten"
          className="shorten-input"
        />
        <CtaButton variant="shorten" onClick={shorten} disabled={busy} className="mx-3 py-2 rounded-full text-[15px]">
          {busy ? 'Shortening…' : 'Shorten'}
        </CtaButton>
      </div>
      {result && (
        <div className="mt-3 flex items-center gap-2 text-sm text-[var(--ink-soft)]">
          <a href={result} target="_blank" rel="noopener noreferrer" className="underline">{result}</a>
          <button onClick={() => navigator.clipboard.writeText(result)} aria-label="Copy link" className="btn btn-secondary w-8 h-8 shrink-0 rounded-full">
            <Copy size={14} />
          </button>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
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

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target == null) return;
    let start = null;
    let raf;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function StatsSection() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/public/stats')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled) setStats(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const paid = useCountUp(stats?.totalPaid);
  const users = useCountUp(stats?.totalUsers);
  const views = useCountUp(stats?.totalViews);
  const links = useCountUp(stats?.totalLinks);

  const items = [
    { label: 'Total paid out', value: stats ? `$${paid.toLocaleString()}` : '—', gradient: 'bg-violet-500' },
    { label: 'Publishers', value: stats ? users.toLocaleString() : '—', gradient: 'bg-emerald-500' },
    { label: 'Views tracked', value: stats ? views.toLocaleString() : '—', gradient: 'bg-amber-500' },
    { label: 'Links shortened', value: stats ? links.toLocaleString() : '—', gradient: 'bg-rose-500' },
  ];

  return (
    <section className="px-6 sm:px-10 max-w-5xl mx-auto py-10">
      <div className="text-center mb-6">
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-[var(--ink)] mb-2">
          Bexalink, by the numbers
        </h2>
        <p className="font-body text-sm text-[var(--ink-soft)]">
          Live stats from our publisher network — updated in real time, no filler.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map((it) => (
          <WidgetStat key={it.label} label={it.label} value={it.value} gradient={it.gradient} />
        ))}
      </div>
      <p className="text-center text-xs font-body text-[var(--ink-faint)] mt-4">
        Payouts available via {stats?.payoutMethods || 5} methods — PayPal, Payoneer, Bank transfer, USDT, UPI
      </p>
    </section>
  );
}

function Hero() {
  return (
    <section className="relative px-6 sm:px-10 max-w-5xl mx-auto pt-10 pb-20">
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
          <WidgetStat label="Payout methods" value="5" gradient="bg-violet-500" />
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

// ── Payout method logos ────────────────────────────────────────────────
// PayPal and Tether (USDT) use their real vector marks. UPI and Payoneer are
// redrawn approximations. To use official artwork instead, drop the file in
// /public/payments/ (e.g. payoneer.svg) and set `src` on that method below.
function PayPalLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden="true">
      <path fill="#003087" d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" />
      <path fill="#009cde" d="M21.222 6.917a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
    </svg>
  );
}

function TetherLogo() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#26A17B" />
      <path fill="#fff" d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117" />
    </svg>
  );
}

function UpiLogo() {
  return (
    <svg viewBox="0 0 48 24" className="w-10 h-5" aria-hidden="true">
      <g transform="translate(5 0) skewX(-14)" stroke="#3c3c3c" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 4.5v9a4.5 4.5 0 0 0 9 0v-9" />
        <path d="M17.5 20V4.5h5a4.2 4.2 0 0 1 0 8.4h-5" />
        <path d="M28.5 4.5V20" />
      </g>
      <polygon fill="#F58220" points="33,3 37,3 42,12 37,21 33,21 38,12" />
      <polygon fill="#097939" points="39,3 43,3 48,12 43,21 39,21 44,12" />
    </svg>
  );
}

function PayoneerLogo() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#FF4800" />
      <path d="M11 24V9h6.5a4.5 4.5 0 0 1 0 9H11" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BankLogo() {
  return (
    <div className={`w-8 h-8 rounded-xl ${BRAND_GRADIENT} flex items-center justify-center`}>
      <Landmark size={17} strokeWidth={2} className="text-white" />
    </div>
  );
}

const PAYOUT_METHODS = [
  { name: 'PayPal', note: 'Online wallet', Logo: PayPalLogo },
  { name: 'Payoneer', note: 'Global payouts', Logo: PayoneerLogo },
  { name: 'Bank transfer', note: 'Straight to your bank', Logo: BankLogo },
  { name: 'USDT', note: 'Tether stablecoin', Logo: TetherLogo },
  { name: 'UPI', note: 'India payments', Logo: UpiLogo },
  // Official artwork: { name: 'PayPal', note: '…', src: '/payments/paypal.svg' }
];

function PayoutCard({ name, note, Logo, src }) {
  return (
    <div className="glass rounded-3xl p-4 sm:p-5 flex sm:flex-col items-center sm:items-start gap-4 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="shrink-0 w-14 h-14 rounded-2xl bg-white border border-white/80 shadow-[0_6px_16px_-8px_rgba(29,27,46,0.35)] flex items-center justify-center">
        {src ? <img src={src} alt="" className="w-8 h-8 object-contain" /> : <Logo />}
      </div>
      <div>
        <h3 className="font-display font-semibold text-base text-[var(--ink)] leading-tight">{name}</h3>
        <p className="font-body text-xs text-[var(--ink-faint)] mt-1">{note}</p>
      </div>
    </div>
  );
}

function Payouts() {
  return (
    <section id="payouts" className="px-6 sm:px-10 max-w-5xl mx-auto py-10 relative">
      <div className="absolute top-0 left-1/4 w-56 h-56 rounded-full bg-gradient-to-br from-sky-300 to-indigo-400 opacity-20 blur-3xl -z-10" />
      <h2 className="font-display font-bold text-3xl text-[var(--ink)] mb-2">Five ways to get paid, worldwide.</h2>
      <p className="font-body text-[var(--ink-soft)] mb-8 max-w-md">Pick the one that suits where you live and withdraw to it.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {PAYOUT_METHODS.map((m) => (
          <PayoutCard key={m.name} {...m} />
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
          <a
            href="/signup"
            aria-label="Create your account"
            className="w-9 h-9 rounded-full bg-white border border-black/10 flex items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-95"
          >
            <ArrowRight size={15} className="text-black" />
          </a>
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
          <CtaButton href="/signup" className="flex-1 px-5 py-2.5 rounded-full text-[13px]">
            Get started
          </CtaButton>
          <a href="/login" aria-label="Log in" className="btn btn-secondary w-11 h-11 shrink-0 rounded-full">
            <ArrowRight size={16} />
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
          <BrandLogo size="sm" />
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
    <div className="min-h-screen relative isolate">
      <Nav />
      <Hero />
      <StatsSection />
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
