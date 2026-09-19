import { StaticHeader, StaticFooter } from '../../frontend/StaticPageChrome';

export const metadata = {
  title: 'DMCA Policy — Bexalink',
  description: 'How to submit a DMCA takedown notice for content linked through Bexalink.',
};

const DMCA_EMAIL = 'bexalinks@gmail.com';

export default function DmcaPage() {
  return (
    <>
      <StaticHeader />
      <main className="px-6 sm:px-10 py-14 max-w-3xl mx-auto">
        <div className="relative p-7 sm:p-10 overflow-hidden glass-strong" style={{ borderRadius: 40 }}>
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-200/60 via-sky-100/40 to-pink-100/50" />

          <h1 className="font-display font-bold text-3xl sm:text-4xl text-[var(--ink)] mb-4">DMCA Policy</h1>

          <p className="font-body text-[var(--ink-soft)] leading-relaxed mb-4">
            Bexalink is a link-shortening service. We do not host, store, or control the destination content
            that a shortened link points to — we simply redirect visitors to a URL supplied by the person who
            created the link. That said, we take copyright seriously and will act on valid takedown notices
            submitted under the Digital Millennium Copyright Act (DMCA).
          </p>

          <h2 className="font-display font-bold text-xl text-[var(--ink)] mt-8 mb-3">Filing a takedown notice</h2>
          <p className="font-body text-[var(--ink-soft)] leading-relaxed mb-4">
            If you believe a Bexalink short link redirects to content that infringes your copyright, send a
            written notice to <a href={`mailto:${DMCA_EMAIL}`} className="text-[var(--ink)] font-medium underline">{DMCA_EMAIL}</a> with
            the subject line <span className="font-semibold text-[var(--ink)]">&quot;DMCA Takedown Request&quot;</span>, including:
          </p>
          <ul className="font-body text-[var(--ink-soft)] leading-relaxed list-disc pl-5 space-y-2 mb-4">
            <li>A description of the copyrighted work you believe has been infringed.</li>
            <li>The exact Bexalink short link(s) (e.g. bexalink.com/abc123) involved.</li>
            <li>Your name, mailing address, phone number, and email address.</li>
            <li>A statement that you have a good-faith belief the use is not authorized by the copyright owner, its agent, or the law.</li>
            <li>A statement, made under penalty of perjury, that the information in the notice is accurate and that you are the copyright owner or authorized to act on their behalf.</li>
            <li>Your physical or electronic signature.</li>
          </ul>

          <h2 className="font-display font-bold text-xl text-[var(--ink)] mt-8 mb-3">What happens next</h2>
          <p className="font-body text-[var(--ink-soft)] leading-relaxed mb-4">
            Once we receive a complete notice, we review it and, where appropriate, disable or remove the
            reported short link. We may notify the publisher who created the link so they can respond with a
            counter-notice if they believe the takedown was made in error.
          </p>

          <h2 className="font-display font-bold text-xl text-[var(--ink)] mt-8 mb-3">Counter-notice</h2>
          <p className="font-body text-[var(--ink-soft)] leading-relaxed mb-4">
            If your link was disabled and you believe this was a mistake or misidentification, you may submit a
            counter-notice to the same email address including your contact details, identification of the
            disabled link, and a statement under penalty of perjury that you have a good-faith belief the link
            was disabled as a result of mistake or misidentification.
          </p>

          <h2 className="font-display font-bold text-xl text-[var(--ink)] mt-8 mb-3">Repeat infringers</h2>
          <p className="font-body text-[var(--ink-soft)] leading-relaxed">
            Accounts associated with repeated, valid copyright complaints will be suspended or permanently
            banned from Bexalink at our discretion.
          </p>
        </div>
      </main>
      <StaticFooter />
    </>
  );
}
