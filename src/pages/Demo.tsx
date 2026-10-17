/** Demo launcher. Every sample is original and fictional. */

import { Link } from 'react-router-dom';
import { Card, Notice, Page, PageTitle } from '../components/ui';
import { DEMO_UI } from '../core/demoScript';
import { DEMO_INPUTS } from '../demo/inputs';
import { cachedDemo } from '../demo/cache';
import { useLanguage } from '../lib/language';

export default function Demo() {
  const { s } = useLanguage();

  return (
    <Page>
      <PageTitle
        sub={s({
          en: 'Preloaded inputs for a live run-through. All sample content is original and fictional.',
          hi: 'लाइव दिखाने के लिए पहले से भरे इनपुट। सारा नमूना सामग्री मौलिक और काल्पनिक है।',
        })}
      >
        {s({ en: 'Demo', hi: 'डेमो' })}
      </PageTitle>

      <div className="mb-6 rounded-3xl bg-gradient-to-br from-[#1c1c28] via-[#12121b] to-[#0a0a0f] p-5 sm:p-7 text-white shadow-md border border-white/10 relative overflow-hidden w-full max-w-full">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full opacity-30 blur-2xl"
          style={{ background: 'var(--indigo)' }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-white/90 border border-white/15">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
            {s({ en: '4 Acts · 3-Minute Run', hi: '4 भाग · 3 मिनट का रन' })}
          </div>
          <h2 className="display mt-3 text-xl sm:text-3xl font-bold tracking-tight break-words">
            {s({
              en: 'The message, the privacy proof, the photo, the scammer',
              hi: 'संदेश, प्राइवेसी का सबूत, फ़ोटो, और ठग',
            })}
          </h2>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-white/70 break-words">
            {s({
              en: 'A guided run with narration on screen and nothing to type. Every act runs the real AI pipeline.',
              hi: 'निर्देशित डेमो, स्क्रीन पर ही बोलने की लाइनें, कुछ टाइप नहीं करना। हर भाग असली पाइपलाइन चलाता है।',
            })}
          </p>
          <div className="mt-5">
            <Link
              to="/demo/run"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-ink shadow-sm transition-transform active:scale-[0.98] hover:bg-white/90"
            >
              <span>{s(DEMO_UI.start)}</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <ul className="grid gap-3.5 sm:gap-4 md:grid-cols-2 w-full max-w-full">
        {DEMO_INPUTS.map((demo) => {
          const cached = cachedDemo(demo.id);
          const to =
            demo.route === '/protect' ? '/protect' : `/check?demo=${demo.id}`;

          const typeBadges: Record<string, { label: { en: string; hi: string }; icon: string }> = {
            kyc_sms: { label: { en: 'SMS Message', hi: 'एसएमएस संदेश' }, icon: '💬' },
            digital_arrest_call: { label: { en: 'Voice Call', hi: 'वॉइस कॉल' }, icon: '📞' },
            currency_hoax: { label: { en: 'Viral Forward', hi: 'वायरल फ़ॉरवर्ड' }, icon: '🔁' },
            post_xray_photo: { label: { en: 'Photo Post', hi: 'फ़ोटो पोस्ट' }, icon: '📷' },
            upi_qr: { label: { en: 'UPI QR Code', hi: 'यूपीआई क्यूआर' }, icon: '⚡' },
          };

          const badge = typeBadges[demo.id] ?? { label: { en: 'Sample', hi: 'नमूना' }, icon: '📄' };

          return (
            <li key={demo.id} className="w-full max-w-full overflow-hidden">
              <Card className="flex h-full flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas-soft px-2.5 py-0.5 text-[0.7rem] font-semibold text-ink-soft">
                      <span>{badge.icon}</span>
                      <span>{s(badge.label)}</span>
                    </span>
                    {cached ? (
                      <span className="inline-flex items-center gap-1 text-[0.65rem] font-medium text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {s({ en: 'Offline Ready', hi: 'ऑफ़लाइन तैयार' })}
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-2.5 text-base sm:text-lg font-bold leading-snug break-words">{s(demo.title)}</h2>

                  <div className="mt-3 rounded-2xl bg-canvas-soft/80 p-3 text-xs sm:text-sm leading-relaxed text-ink-soft border border-line/10 line-clamp-4 break-words break-all [overflow-wrap:anywhere]">
                    {demo.text}
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <Link
                    to={to}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-sm transition-transform active:scale-[0.98] hover:bg-ink-soft"
                  >
                    <span>{s({ en: 'Run this demo', hi: 'यह डेमो चलाइए' })}</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <div className="mt-8">
        <Notice>
          {s({
            en: 'A cached result is always labelled as an offline demo result. Nothing recorded is ever shown as if it were live.',
            hi: 'कैश किया नतीजा हमेशा "ऑफ़लाइन डेमो परिणाम" लिखकर दिखाया जाता है। रिकॉर्ड किया नतीजा कभी लाइव बताकर नहीं दिखाया जाता।',
          })}
        </Notice>
      </div>
    </Page>
  );
}
