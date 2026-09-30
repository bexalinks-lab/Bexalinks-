'use client';
// LandingPage.jsx
// Public marketing page for Bexalink — "Liquid Glass" design language:
// frosted translucent panels floating over a soft gradient-blob backdrop
// (see app/globals.css for the fixed background + .glass utilities),
// gradient icon badges with a glossy highlight for a 3D-widget feel, and a
// bold rounded display face instead of the earlier ledger/serif treatment.

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Globe2, Landmark, Link2, Menu, ShieldCheck, Wallet, Users, Copy, X,
  TrendingUp, LayoutDashboard, Headset, CheckCircle2, Star, ArrowUp, Share2,
  EyeOff, Lock, Clock, DollarSign, Sparkles, ChevronRight,
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

// App-icon tile: dark glossy squircle with a bright glyph (like a phone
// home-screen icon). The accent colour is derived from the old gradient
// string, so existing callers keep working.
const TINTS = { indigo: '#818cf8', violet: '#a78bfa', purple: '#c084fc', sky: '#38bdf8', blue: '#60a5fa', cyan: '#22d3ee', pink: '#f472b6', rose: '#fb7185', emerald: '#34d399', teal: '#2dd4bf', amber: '#fbbf24', orange: '#fb923c' };
function tintOf(gradient = '') {
  const m = gradient.match(/(indigo|violet|purple|sky|blue|cyan|pink|rose|emerald|teal|amber|orange)/);
  return TINTS[m ? m[1] : 'violet'];
}
function IconBadge({ icon: Icon, gradient, size = 44 }) {
  const tint = tintOf(gradient);
  return (
    <div className="app-icon" style={{ width: size, height: size }}>
      <Icon size={size * 0.46} strokeWidth={1.9} className="relative z-10" style={{ color: tint, filter: `drop-shadow(0 0 6px ${tint}88)` }} />
    </div>
  );
}

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '/rates', label: 'Rates' },
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
            className="md:hidden w-10 h-10 rounded-lg border-2 border-[var(--ink)] flex items-center justify-center bg-white"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <nav
            id="mobile-menu"
            className="md:hidden absolute right-6 sm:right-10 top-full mt-1 w-60 bg-white rounded-2xl p-2 flex flex-col font-body text-sm font-medium text-[var(--ink)] shadow-2xl border border-black/5"
          >
            {[...NAV_LINKS, { href: '/login', label: 'Log in' }, { href: '/signup', label: 'Sign up' }].map((l, i, arr) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-xl hover:bg-black/5 transition-colors ${i < arr.length - 1 ? 'border-b border-black/5' : ''}`}
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
    <div className="font-shorten w-full max-w-md">
      <div className="sh-card">
        <div className="sh-head">
          <span className="sh-eyebrow">SHORTEN &amp; EARN</span>
          <span className="sh-chip">Free to join</span>
        </div>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && shorten()}
          placeholder="Paste a link to shorten and monetize"
          aria-label="Link to shorten"
          className="shorten-input"
        />
        <CtaButton variant="shorten" onClick={shorten} disabled={busy} className="mx-2 mt-4 py-2 rounded-full text-[15px] w-[calc(100%-1rem)]">
          {busy ? 'Shortening…' : 'Shorten'}
        </CtaButton>
        <div className="sh-divider" />
        <div className="sh-row sh-blue"><i /><span>First payout</span><b>$5</b></div>
        <div className="sh-row sh-pink"><i /><span>Card required</span><b>No</b></div>
      </div>
      <div className="sh-wave" aria-hidden="true">
        <svg viewBox="0 0 380 70" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          <path d="M0 40 Q190 -6 380 40" fill="none" stroke="rgba(10,132,255,.25)" strokeWidth="2" />
          <path d="M0 46 Q190 84 380 40" fill="none" stroke="rgba(255,45,143,.25)" strokeWidth="2" />
        </svg>
        <span className="sh-handle" style={{ top: 8, background: '#0a84ff' }} />
        <span className="sh-handle" style={{ top: 38, background: '#ff2d8f' }} />
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

function Money({ v }) {
  const [int, dec] = v.split('.');
  return <>{int}{dec && <span className="opacity-30">.{dec}</span>}</>;
}

function SectionHead({ eyebrow, title, sub, className = '' }) {
  return (
    <Reveal from="left" className={`mb-8 max-w-lg ${className}`}>
      <span className="inline-flex glass rounded-full px-3 py-1 text-[11px] font-body font-semibold tracking-wider uppercase text-indigo-600 mb-3">{eyebrow}</span>
      <h2 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight text-[var(--ink)] mb-2">{title}</h2>
      {sub && <p className="font-body text-[var(--ink-soft)] text-sm sm:text-base leading-relaxed">{sub}</p>}
    </Reveal>
  );
}

// Dashboard-style stat tile: icon badge, big value, soft colour wash.
function WidgetStat({ label, value, sublabel, gradient, icon: Icon }) {
  return (
    <div className="lift card-x p-5">
      {Icon && <div className="relative z-10 mb-4"><IconBadge icon={Icon} gradient={gradient} size={44} /></div>}
      <p className="text-[11px] font-body font-semibold uppercase tracking-wider text-[var(--ink-faint)] mb-1.5 relative z-10 flex items-center gap-2"><span className={`w-1 h-3.5 rounded-full ${gradient}`} />{label}</p>
      <p className="font-display font-extrabold text-[2rem] leading-none text-[var(--ink)] relative z-10">{value}</p>
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
    { label: 'Total paid out', value: stats ? `$${paid.toLocaleString()}` : '—', gradient: 'bg-violet-500', icon: Wallet },
    { label: 'Publishers', value: stats ? users.toLocaleString() : '—', gradient: 'bg-emerald-500', icon: Users },
    { label: 'Views tracked', value: stats ? views.toLocaleString() : '—', gradient: 'bg-amber-500', icon: TrendingUp },
    { label: 'Links shortened', value: stats ? links.toLocaleString() : '—', gradient: 'bg-rose-500', icon: Link2 },
  ];

  return (
    <section className="px-6 sm:px-10 max-w-5xl mx-auto py-10">
      <SectionHead eyebrow="Live stats" title="Bexalink, by the numbers." sub="Live stats from our publisher network — updated in real time, no filler." />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map((it, n) => (
          <Reveal key={it.label} from={n % 2 ? 'right' : 'left'} delay={Math.floor(n / 2) * 120}>
            <WidgetStat label={it.label} value={it.value} gradient={it.gradient} icon={it.icon} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// Thin line-art hero graphic: link → cloud → wallet, in the brand's
// indigo/violet/pink gradient. Pure inline SVG, no external image.
function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 600 200"
      className="w-full max-w-md h-auto mb-8"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="heroLine" x1="0" y1="0" x2="600" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="55%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>

      {/* connecting path: link node → cloud → wallet */}
      <path
        d="M95 100 H210 C230 100 230 60 250 60 H350 C370 60 370 140 390 140 H505"
        stroke="url(#heroLine)" strokeWidth="2" strokeDasharray="1 9" strokeLinecap="round"
      />

      {/* link node */}
      <circle cx="60" cy="100" r="42" fill="url(#heroLine)" opacity="0.08" />
      <circle cx="60" cy="100" r="42" stroke="url(#heroLine)" strokeWidth="1.5" />
      <g transform="translate(60 100)" stroke="url(#heroLine)" strokeWidth="2.4" strokeLinecap="round">
        <path d="M-14 -6 a8 8 0 0 1 0 -11 l6 -6 a8 8 0 0 1 12 12 l-3 3" />
        <path d="M14 6 a8 8 0 0 1 0 11 l-6 6 a8 8 0 0 1 -12 -12 l3 -3" />
      </g>

      {/* cloud node */}
      <circle cx="300" cy="40" r="34" fill="url(#heroLine)" opacity="0.08" />
      <circle cx="300" cy="40" r="34" stroke="url(#heroLine)" strokeWidth="1.5" />
      <path
        d="M286 45 a9 9 0 0 1 2 -17.7 a11 11 0 0 1 21 3.6 a8 8 0 0 1 -2 15.6 h-21 a7 7 0 0 1 0 -1.5 Z"
        stroke="url(#heroLine)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"
      />

      {/* wallet / payout node */}
      <circle cx="540" cy="140" r="42" fill="url(#heroLine)" opacity="0.08" />
      <circle cx="540" cy="140" r="42" stroke="url(#heroLine)" strokeWidth="1.5" />
      <g transform="translate(540 140)" stroke="url(#heroLine)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        <rect x="-16" y="-11" width="32" height="22" rx="4" />
        <path d="M-16 -4 h32" />
        <circle cx="8" cy="7" r="2.4" fill="url(#heroLine)" stroke="none" />
      </g>

      {/* small floating accent dots, matching the reference cubes */}
      <circle cx="180" cy="70" r="4" fill="url(#heroLine)" opacity="0.6" />
      <circle cx="420" cy="105" r="4" fill="url(#heroLine)" opacity="0.6" />
      <circle cx="460" cy="60" r="3" fill="url(#heroLine)" opacity="0.4" />
    </svg>
  );
}

// Fades + slides a section up the first time it scrolls into view.
// Scroll reveal: boxes slide in from the side (or rise / scale) when they enter the
// viewport and play again when you scroll back to them.
function Reveal({ children, className = '', from = 'up', delay = 0 }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: from === 'fade' ? 0 : 0.12, rootMargin: '0px 0px -6% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [from]);
  return (
    <div ref={ref} className={`reveal reveal-${from} ${on ? 'reveal-in' : ''} ${className}`} style={{ transitionDelay: on ? `${delay}ms` : '0ms' }}>
      {children}
    </div>
  );
}

// Thin gradient bar at the very top that fills as you scroll down the page.
function ScrollProgress() {
  const bar = useRef(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const v = h > 0 ? Math.min(1, window.scrollY / h) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${v})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return <div ref={bar} className="scroll-progress" aria-hidden="true" />;
}

const MOCK_LINKS = [
  { code: 'bexa.link/summer', views: '12,480', earned: '$58.20' },
  { code: 'bexa.link/pdf-guide', views: '8,912', earned: '$41.05' },
  { code: 'bexa.link/tg-drop', views: '5,307', earned: '$24.60' },
];

// Product mockup of the real dashboard — pure CSS/SVG, no image files.
function DashboardMockup() {
  return (
    <div className="relative max-w-xl mx-auto">
      <div className="absolute -inset-6 -z-10 rounded-[56px] bg-gradient-to-br from-indigo-300/40 via-sky-200/30 to-pink-200/40 blur-3xl" />
      <div className="absolute inset-x-8 -top-3 h-8 rounded-t-[32px] bg-indigo-300/60" />
      <div className="absolute inset-x-4 -top-1.5 h-8 rounded-t-[34px] bg-sky-200/80" />
      <div className="relative overflow-hidden bg-[#0d1020] p-3 sm:p-4 pt-14 grid-bg" style={{ borderRadius: 40, boxShadow: '0 30px 60px -24px rgba(30,30,80,.55)' }}>
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-sky-500 opacity-40 blur-3xl" />
        <span className="absolute top-5 left-6 font-display font-semibold text-white text-base">Earnings</span>
        <span className={`absolute top-4 right-5 w-9 h-9 rounded-full ${BRAND_GRADIENT} border-2 border-white/80`} />
        <div className="relative bg-white rounded-[28px] p-4 sm:p-6 text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-body font-semibold uppercase tracking-wider text-[var(--ink-faint)] bg-slate-100 rounded-full px-3 py-1">Your balance</span>
            <span className="text-[11px] font-body px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 font-semibold">+12.4%</span>
          </div>
          <p className="font-display font-extrabold text-4xl text-[var(--ink)] mb-2">$<Money v="1,284.60" /></p>
          <svg viewBox="0 0 300 90" className="w-full h-auto mb-4" role="img" aria-label="Earnings trend">
            <defs>
              <linearGradient id="mk-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8B5CF6" stopOpacity="0.35" /><stop offset="1" stopColor="#8B5CF6" stopOpacity="0" /></linearGradient>
              <linearGradient id="mk-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#38BDF8" /><stop offset="1" stopColor="#EC4899" /></linearGradient>
            </defs>
            <path d="M0 70 C30 62 45 72 75 55 S120 40 150 46 S200 22 230 28 S275 10 300 8 V90 H0Z" fill="url(#mk-fill)" />
            <path d="M0 70 C30 62 45 72 75 55 S120 40 150 46 S200 22 230 28 S275 10 300 8" fill="none" stroke="url(#mk-line)" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <ul className="flex flex-col gap-2 mb-4">
            {MOCK_LINKS.map((l, i) => (
              <li key={l.code} className="flex items-center gap-2.5 rounded-2xl bg-slate-50 px-3.5 py-2.5">
                <span className={`w-1 h-4 rounded-full ${['bg-sky-400', 'bg-pink-400', 'bg-amber-400'][i]}`} />
                <span className="flex-1 text-xs sm:text-sm font-body font-medium text-[var(--ink)] truncate">{l.code}</span>
                <span className="text-xs sm:text-sm font-body font-semibold text-[var(--ink)]">{l.earned}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <span className="flex-1 flex items-center justify-center gap-2 rounded-full bg-slate-100 py-3 text-sm font-body font-medium text-[var(--ink)]"><Share2 size={15} /> Share</span>
            <span className="flex-1 flex items-center justify-center gap-2 rounded-full bg-black py-3 text-sm font-body font-medium text-white">Withdraw <ArrowUp size={15} /></span>
          </div>
        </div>
      </div>
      <div className="float-chip glass-strong absolute -top-4 -right-1 sm:-right-6 px-3.5 py-2.5 flex items-center gap-2" style={{ borderRadius: 20 }}>
        <IconBadge icon={CheckCircle2} gradient="emerald" size={30} />
        <span className="text-xs font-body leading-tight"><b className="text-[var(--ink)]">Payout sent</b><br /><span className="text-[var(--ink-faint)]">$50.00 · UPI</span></span>
      </div>
    </div>
  );
}

function Chain3D() {
  // Two interlocked chain links built from stacked CSS slices (no 3D library needed).
  const zs = Array.from({ length: 13 }, (_, i) => i - 6);
  const Link = ({ cls, color }) => (
    <div className={`c3-link ${cls}`}>
      {zs.map((z) => (
        <span key={z} className="c3-slice" style={{ '--c': color, transform: `translateZ(${z * 1.6}px)`, filter: `brightness(${(0.82 + (1 - Math.abs(z) / 6) * 0.34).toFixed(2)})` }} />
      ))}
    </div>
  );
  return (
    <div className="c3-scene" aria-hidden="true">
      <div className="c3-float">
        <div className="c3-rot">
          <Link cls="c3-a" color="#3b82f6" />
          <Link cls="c3-b" color="#10b981" />
        </div>
      </div>
      <div className="c3-shadow" />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative px-6 sm:px-10 max-w-5xl mx-auto pt-12 sm:pt-20 pb-10 text-center">
      <Chain3D />
      <h1 style={{ animationDelay: '.05s' }} className="rise font-display font-extrabold text-[2.5rem] sm:text-6xl leading-[1.05] text-[var(--ink)] mb-5 max-w-2xl mx-auto">
        Every link you share can pay you back.
      </h1>
      <p style={{ animationDelay: '.15s' }} className="rise font-subheading text-[var(--ink-soft)] text-base sm:text-lg mb-8 max-w-lg mx-auto leading-relaxed">
        Shorten links, track every verified view and get paid — with
        payouts you can request any day.
      </p>
      <div style={{ animationDelay: '.25s' }} className="rise flex justify-center mb-3"><HeroShortenBar /></div>
      <p className="text-xs font-body text-[var(--ink-faint)] mb-12">No card required. First payout available at $5.</p>
      <DashboardMockup />
    </section>
  );
}

function Step({ n, icon: Icon, gradient, title, children }) {
  return (
    <div className="lift card-x card-rim p-6 flex flex-col gap-5">
      <span className="absolute -top-3 right-4 font-display font-extrabold text-7xl text-black/[0.05] select-none">{n}</span>
      <IconBadge icon={Icon} gradient={gradient} size={52} />
      <div>
        <h3 className="font-display text-[var(--ink)] text-lg font-bold mb-1.5">{title}</h3>
        <p className="font-body text-[var(--ink-soft)] text-sm leading-relaxed">{children}</p>
      </div>
      <span className="text-[11px] font-mono font-semibold tracking-wide text-[var(--ink-soft)] bg-white border border-black/10 shadow-sm rounded-full pl-2.5 pr-3 py-1 self-start flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" />STEP {n}</span>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 sm:px-10 max-w-5xl mx-auto py-10">
      <SectionHead eyebrow="How it works" title="From link to payout, three steps." sub="Shorten it, share it, get paid for it." />
      <div className="grid sm:grid-cols-3 gap-5">
        <Reveal from="left" delay={0*120}><Step n="01" icon={Link2} gradient="bg-gradient-to-br from-indigo-400 to-indigo-600" title="Shorten your link">
          Paste any destination URL into your dashboard or the API. Bexalink
          returns a short link instantly.
        </Step></Reveal>
        <Reveal from="up" delay={1*120}><Step n="02" icon={Globe2} gradient="bg-gradient-to-br from-sky-400 to-cyan-500" title="Share it anywhere">
          Drop it into a video description, a forum post, a Telegram
          channel — wherever your audience already is.
        </Step></Reveal>
        <Reveal from="right" delay={2*120}><Step n="03" icon={Wallet} gradient="bg-gradient-to-br from-pink-400 to-rose-500" title="Get paid per view">
          Each visit is checked for bots and duplicates, then credited to
          your balance at your country's rate.
        </Step></Reveal>
      </div>
    </section>
  );
}

function FeatureCard({ i = 0, icon: Icon, gradient, title, children }) {
  const tint = tintOf(gradient);
  return (
    <Reveal from={i % 2 ? 'right' : 'left'} delay={Math.floor(i / 2) * 100}>
    <div className="lift card-x feat-card" style={{ '--t': tint }}>
      <div className="flex-1 min-w-0">
        <span className="feat-tag">FEATURE</span>
        <h3 className="font-display text-[var(--ink)] text-[1.2rem] leading-tight font-bold mt-3 mb-1.5">{title}</h3>
        <p className="font-body text-[var(--ink-soft)] text-sm leading-relaxed">{children}</p>
      </div>
      <div className="feat-3d" aria-hidden="true">
        <span className="feat-sheet" />
        <span className="feat-tile"><Icon size={30} strokeWidth={2} /></span>
        <span className="feat-chip"><Icon size={16} strokeWidth={2.2} /></span>
      </div>
    </div>
    </Reveal>
  );
}

function Features() {
  return (
    <section className="px-6 sm:px-10 max-w-5xl mx-auto py-10">
      <div className="mb-8 max-w-lg">
        <span className="inline-flex glass rounded-full px-3 py-1 text-[11px] font-body font-semibold tracking-wider uppercase text-indigo-600 mb-3">Features</span>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight text-[var(--ink)] mb-3">
          Built on the parts of ad monetization people complain about most.
        </h2>
        <p className="font-body text-[var(--ink-soft)] text-sm leading-relaxed">
          Every feature below exists because a publisher asked for it —
          rates that hold, fraud caught before it's counted, and payouts
          that don't wait for a batch.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <FeatureCard i={0} icon={ShieldCheck} gradient="bg-gradient-to-br from-violet-400 to-purple-600" title="Fraud filtered before it's counted">
          Bots, VPNs, proxies, and datacenter traffic are screened out
          before a view reaches your earnings.
        </FeatureCard>
        <FeatureCard i={1} icon={Wallet} gradient="bg-gradient-to-br from-pink-400 to-rose-500" title="Same-day payouts">
          Request a withdrawal and it's processed the same day, not held
          for a weekly cycle.
        </FeatureCard>
        <FeatureCard i={2} icon={Users} gradient="bg-gradient-to-br from-sky-400 to-blue-500" title="10% for life, not 30 days">
          Refer another publisher and earn a share of their earnings for as
          long as their account stays active.
        </FeatureCard>
        <FeatureCard i={3} icon={Link2} gradient="bg-gradient-to-br from-indigo-400 to-indigo-600" title="Rates that hold">
          CPM is resolved per country and cached, not renegotiated against
          you once your traffic ramps up.
        </FeatureCard>
        <FeatureCard i={4} icon={TrendingUp} gradient="bg-gradient-to-br from-emerald-400 to-teal-600" title="Highest CPM rates">
          Maximize your traffic earnings with rates that only move up as
          our advertiser demand grows.
        </FeatureCard>
        <FeatureCard i={5} icon={LayoutDashboard} gradient="bg-gradient-to-br from-amber-400 to-orange-500" title="Advanced dashboard">
          Real-time charts, per-link breakdowns, and country-level
          insights — all the control you need in one place.
        </FeatureCard>
        <FeatureCard i={6} icon={Headset} gradient="bg-gradient-to-br from-cyan-400 to-sky-600" title="24/7 customer support">
          Get a real answer any time of day — our support team is always
          on, no matter your timezone.
        </FeatureCard>
      </div>
    </section>
  );
}

function RateRow({ country, cpm, flag }) {
  return (
    <div className="py-3 border-b border-black/5 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="font-body text-sm font-medium text-[var(--ink)] flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-lg" aria-hidden="true">{flag}</span>
          {country}
        </span>
        <span className="font-display font-bold text-base text-[var(--ink)]">${cpm.toFixed(2)}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-slate-200/70 mr-2">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-violet-500 to-pink-500" style={{ width: `${Math.min(100, (cpm / 6.2) * 100)}%` }} />
        <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-[3px] border-pink-500 shadow" style={{ left: `${Math.min(100, (cpm / 6.2) * 100)}%` }} />
      </div>
    </div>
  );
}

function Rates() {
  return (
    <section id="rates" className="px-6 sm:px-10 max-w-5xl mx-auto py-10 grid lg:grid-cols-2 gap-10 items-start">
      <Reveal from="left">
        <span className="inline-flex glass rounded-full px-3 py-1 text-[11px] font-body font-semibold tracking-wider uppercase text-indigo-600 mb-3">CPM rates</span>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight text-[var(--ink)] mb-3">Priced by where your viewer is.</h2>
        <p className="font-body text-[var(--ink-soft)] text-sm leading-relaxed max-w-sm">
          The figures below are current per-1,000-view averages. Your
          dashboard shows the live rate for every country sending you
          traffic.
        </p>
      </Reveal>
      <Reveal from="right">
        <div className="card-x px-6 pt-5 pb-2">
          <div className="flex items-start justify-between pb-4 border-b border-black/5">
            <div>
              <p className="text-[11px] font-body font-semibold uppercase tracking-wider text-[var(--ink-faint)] mb-1">Global average · per 1,000 views</p>
              <p className="font-display font-extrabold text-4xl text-[var(--ink)]">$<Money v="2.90" /></p>
            </div>
            <span className="text-[11px] font-body px-3 py-1.5 rounded-full bg-black text-white font-medium flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Live</span>
          </div>
          <RateRow country="United States" cpm={6.2} flag="🇺🇸" />
          <RateRow country="United Kingdom" cpm={5.4} flag="🇬🇧" />
          <RateRow country="Germany" cpm={5.1} flag="🇩🇪" />
          <RateRow country="India" cpm={1.3} flag="🇮🇳" />
          <RateRow country="Brazil" cpm={1.6} flag="🇧🇷" />
          <RateRow country="Global average" cpm={2.9} flag="🌍" />
        </div>
      </Reveal>
    </section>
  );
}

const TESTIMONIALS = [
  {
    quote: "I moved my whole Telegram audience over about four months ago. Payouts have landed on time every week since.",
    name: "Priya Nair — independent publisher",
  },
  {
    quote: "Started with one WhatsApp group of 200 people. Didn't expect the CPM to actually hold up, but it did.",
    name: "Marco Silva — community admin, Brazil",
  },
  {
    quote: "Switched over from another shortener after a payout got stuck for three weeks there. Bexalink paid within a day.",
    name: "Ahmed Raza — YouTube creator",
  },
  {
    quote: "The referral share alone covers my hosting bill now. Didn't even have to do anything extra for it.",
    name: "Lisa Chen — blogger",
  },
  {
    quote: "I run a small Discord server. Never thought link shortening could be a real side income until this.",
    name: "Daniel Okafor — Discord community owner",
  },
];

function Testimonial() {
  return (
    <section className="px-6 sm:px-10 max-w-5xl mx-auto py-10">
      <SectionHead eyebrow="Testimonials" title="Hear from our users." sub="See what our users have to say about their experience with Bexalink." />
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 sm:mx-0 px-6 sm:px-0" style={{ scrollbarWidth: 'none' }}>
        {TESTIMONIALS.map((t) => {
          const [person, role] = t.name.split(' — ');
          return (
            <div key={t.name} className="lift card-x p-6 shrink-0 snap-center w-[85%] sm:w-[380px] flex flex-col">
              <div className="flex items-center justify-between mb-4"><span className="text-[11px] font-body font-semibold uppercase tracking-wider text-[var(--ink-faint)] bg-slate-100 rounded-full px-3 py-1">Verified</span><div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
              </div></div>
              <p className="font-body text-base text-[var(--ink)] leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-full ${BRAND_GRADIENT} flex items-center justify-center text-white font-display font-bold text-sm`}>{person[0]}</span>
                <span className="leading-tight">
                  <span className="block font-body text-sm font-semibold text-[var(--ink)]">{person}</span>
                  <span className="block font-body text-xs text-[var(--ink-faint)]">{role}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs font-body text-[var(--ink-faint)] mt-1 sm:hidden">← swipe →</p>
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

function Payouts() {
  const [i, setI] = useState(0);
  const last = useRef(0);
  const n = PAYOUT_METHODS.length;
  const cur = PAYOUT_METHODS[i];
  // Offset of each card from the centre, wrapped into -2..2.
  const offset = (idx) => ((idx - i + n + 2) % n) - 2;
  useEffect(() => {
    const t = setInterval(() => {
      if (Date.now() - last.current > 6000) setI((v) => (v + 1) % n);
    }, 3200);
    return () => clearInterval(t);
  }, [n]);
  return (
    <section id="payouts" className="px-6 sm:px-10 max-w-5xl mx-auto py-10 relative">
      <Reveal from="left">
        <h2 className="font-display font-bold text-3xl text-[var(--ink)] mb-2">Five ways to get paid, worldwide.</h2>
        <p className="font-body text-[var(--ink-soft)] mb-8 max-w-md">Pick the one that suits where you live and withdraw to it.</p>
      </Reveal>
      <Reveal from="right"><div className="pay-panel">
        <div className="pay-rings" aria-hidden="true" />
        <div className="pay-tiles" aria-hidden="true"><span /><span /><span /></div>
        <div className="pay-stage">
          {PAYOUT_METHODS.map((m, idx) => {
            const k = offset(idx);
            return (
              <button
                key={m.name}
                type="button"
                className="pay-card"
                data-k={k}
                onClick={() => { last.current = Date.now(); setI(idx); }}
                aria-label={k === 0 ? m.name : `Show ${m.name}`}
                aria-current={k === 0}
              >
                <span className="pay-tag">Same day</span>
                <span className="pay-dot" />
                <span className="pay-logo">{m.src ? <img src={m.src} alt="" className="w-9 h-9 object-contain" /> : <m.Logo />}</span>
                <span className="pay-name">{m.name}</span>
                <span className="pay-note">{m.note}</span>
              </button>
            );
          })}
        </div>
        <a href="/signup" className="pay-btn">Withdraw to {cur.name}</a>
        <div className="pay-dots" aria-hidden="true">
          {PAYOUT_METHODS.map((m, idx) => <span key={m.name} className={idx === i ? 'on' : ''} />)}
        </div>
      </div></Reveal>
    </section>
  );
}

const GAME_CHANGER_POINTS = [
  { icon: EyeOff, text: 'No captcha & adult ads' },
  { icon: Lock, text: 'Advanced security options' },
  { icon: Clock, text: 'Regular payments' },
  { icon: DollarSign, text: '$5.00 minimum withdrawal' },
  { icon: Globe2, text: '5 international & local payout methods' },
];

function WhyChooseUs() {
  return (
    <section className="px-6 sm:px-10 max-w-5xl mx-auto py-10 relative">
      <Reveal from="left"><div className="suggest-card">
        <div className="suggest-head">
          <h2 className="font-display font-bold text-[1.35rem] sm:text-2xl leading-tight text-[var(--ink)] flex items-center gap-2">
            <Sparkles size={18} strokeWidth={2} className="shrink-0" /> Bexalink is a game-changer.
          </h2>
          <p className="font-body text-[12.5px] leading-snug text-[var(--ink-soft)] mt-1.5">
            Built for hardworking creators, without the friction that slows other shorteners down.
          </p>
        </div>
        <ul>
          {GAME_CHANGER_POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="suggest-row">
              <span className="suggest-ico"><Icon size={17} strokeWidth={1.9} /></span>
              <span className="flex-1 font-body text-[15px] font-medium text-[var(--ink)] leading-tight">{text}</span>
              <ChevronRight size={18} className="text-[var(--ink-soft)] shrink-0" />
            </li>
          ))}
        </ul>
        <a href="/signup" className="suggest-cta">
          <span className="suggest-ico suggest-ico-lg"><ArrowUp size={18} className="rotate-45" /></span>
          <span className="font-body text-xs text-[var(--ink-faint)]">start earning…</span>
        </a>
      </div></Reveal>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="px-4 sm:px-10 max-w-5xl mx-auto py-16">
      <div className="relative overflow-hidden grid-bg bg-[#0B0B12] text-center px-6 sm:px-12 py-14 sm:py-20" style={{ borderRadius: 40 }}>
        <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-indigo-500 opacity-30 blur-3xl" />
        <div className="absolute -bottom-28 -right-10 w-80 h-80 rounded-full bg-pink-500 opacity-25 blur-3xl" />
        <div className="relative">
          <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-tight mb-4 max-w-xl mx-auto">
            Start earning from your links today.
          </h2>
          <p className="font-body text-white/60 text-sm sm:text-base mb-8 max-w-md mx-auto">
            Free to join. No minimum traffic. Withdraw from $5 to UPI, PayPal, Payoneer, bank or USDT.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/signup" className="btn w-full sm:w-auto px-7 py-3 rounded-full bg-white text-[#0B0B12] font-body font-semibold text-sm hover:bg-white/90 transition-colors">
              Create free account <ArrowRight size={15} />
            </a>
            <a href="/login" className="btn w-full sm:w-auto px-7 py-3 rounded-full border border-white/25 text-white font-body font-medium text-sm hover:bg-white/10 transition-colors">
              Log in
            </a>
          </div>
          <div className="flex items-center justify-center gap-8 mt-10 text-center">
            {[['$4.80', 'Avg. CPM'], ['10%', 'Referral'], ['<24h', 'Payout']].map(([v, l]) => (
              <div key={l}><p className="font-display font-bold text-lg text-white">{v}</p><p className="text-xs font-body text-white/45">{l}</p></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative overflow-hidden">
      <div className="footer-sunburst" aria-hidden="true" />
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
    <div className="min-h-screen relative isolate overflow-x-clip">
      <ScrollProgress />
      <Nav />
      <Hero />
      <Reveal from="fade"><StatsSection /></Reveal>
      <Reveal from="fade"><HowItWorks /></Reveal>
      <Reveal from="fade"><Features /></Reveal>
      <Reveal from="fade"><Rates /></Reveal>
      <Reveal from="fade"><Testimonial /></Reveal>
      <Reveal from="fade"><WhyChooseUs /></Reveal>
      <Reveal from="fade"><Payouts /></Reveal>
      <Reveal from="scale"><ClosingCTA /></Reveal>
      <Footer />
    </div>
  );
}
