// StaticPageChrome.jsx
// Lightweight header + footer shared by the simple content pages
// (About, Contact, DMCA) so they look like part of the same site as the
// landing page without pulling in the marketing nav's mobile-menu logic.

import BrandLogo from './BrandLogo';

export function StaticHeader() {
  return (
    <header className="sticky top-0 z-30 glass-strong">
      <div className="flex items-center justify-between gap-4 px-6 sm:px-10 py-4 max-w-3xl mx-auto">
        <BrandLogo href="/" />
        <a href="/" className="text-sm font-body font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">
          Back to home
        </a>
      </div>
    </header>
  );
}

export function StaticFooter() {
  return (
    <footer className="px-6 sm:px-10 py-10 max-w-3xl mx-auto text-center">
      <p className="text-xs font-body text-[var(--ink-faint)]">
        © {new Date().getFullYear()} Bexalink, a Bexa Network product. All rights reserved.
      </p>
      <p className="text-xs font-body text-[var(--ink-faint)] mt-2 flex items-center justify-center gap-3 flex-wrap">
        <a href="/about" className="hover:text-[var(--ink-soft)]">About</a>
        <span>·</span>
        <a href="/contact" className="hover:text-[var(--ink-soft)]">Contact</a>
        <span>·</span>
        <a href="/dmca" className="hover:text-[var(--ink-soft)]">DMCA</a>
      </p>
    </footer>
  );
}
