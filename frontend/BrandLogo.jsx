// BrandLogo.jsx
// Bexa Link lockup: link icon + "Bexa Link" wordmark, side by side.
// Both files are black on transparent, so they sit directly on the light
// glass backdrop — no dark chip or capsule behind them.

import { ICON_DATA_URI, WORDMARK_DATA_URI } from './brand-assets';

const SIZES = {
  // icon size / wordmark height, in px
  sm: { icon: 24, word: 15 },
  md: { icon: 28, word: 18 },
};

export default function BrandLogo({ size = 'md', href, className = '' }) {
  const { icon, word } = SIZES[size] ?? SIZES.md;
  const content = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ICON_DATA_URI} alt="" width={icon} height={icon} style={{ width: icon, height: icon }} className="shrink-0" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={WORDMARK_DATA_URI} alt="Bexa Link" style={{ height: word, width: 'auto' }} className="shrink-0" />
    </>
  );
  const base = `inline-flex items-center gap-2 shrink-0 ${className}`;
  return href ? (
    <a href={href} aria-label="Bexa Link home" className={base}>{content}</a>
  ) : (
    <span className={base}>{content}</span>
  );
}
