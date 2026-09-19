import { Mail, Clock, ShieldAlert } from 'lucide-react';
import { StaticHeader, StaticFooter } from '../../frontend/StaticPageChrome';

export const metadata = {
  title: 'Contact — Bexalink',
  description: 'Get in touch with the Bexalink team.',
};

const CONTACT_EMAIL = 'bexalinks@gmail.com';

export default function ContactPage() {
  return (
    <>
      <StaticHeader />
      <main className="px-6 sm:px-10 py-14 max-w-3xl mx-auto">
        <div className="relative p-7 sm:p-10 overflow-hidden glass-strong" style={{ borderRadius: 40 }}>
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-200/60 via-sky-100/40 to-pink-100/50" />

          <h1 className="font-display font-bold text-3xl sm:text-4xl text-[var(--ink)] mb-4">Contact us</h1>
          <p className="font-body text-[var(--ink-soft)] leading-relaxed mb-8">
            Questions about your account, payouts, or a link that isn&apos;t tracking correctly? Send us an email
            and our team will get back to you.
          </p>

          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="flex items-center gap-4 bg-white/60 border border-white/70 rounded-3xl px-6 py-5 mb-6 hover:bg-white/80 transition-colors"
          >
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 flex items-center justify-center shrink-0">
              <Mail size={18} className="text-white" />
            </span>
            <span>
              <span className="block text-xs font-body text-[var(--ink-faint)]">Email us</span>
              <span className="block font-display font-semibold text-lg text-[var(--ink)]">{CONTACT_EMAIL}</span>
            </span>
          </a>

          <div className="flex items-start gap-3 mb-4">
            <Clock size={16} className="text-[var(--ink-faint)] shrink-0 mt-0.5" />
            <p className="font-body text-sm text-[var(--ink-soft)]">
              We typically reply within 24–48 hours. For payout issues, please include your account email and
              the date of the request.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <ShieldAlert size={16} className="text-[var(--ink-faint)] shrink-0 mt-0.5" />
            <p className="font-body text-sm text-[var(--ink-soft)]">
              Reporting copyrighted or infringing content? Please use our{' '}
              <a href="/dmca" className="text-[var(--ink)] font-medium underline">DMCA</a> page instead so your
              notice reaches the right team faster.
            </p>
          </div>
        </div>
      </main>
      <StaticFooter />
    </>
  );
}
