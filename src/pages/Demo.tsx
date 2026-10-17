/** Demo launcher. Every sample is original and fictional. */

import { Link } from 'react-router-dom';
import { Card, Notice, Page, PageTitle } from '../components/ui';
import { PillLink } from '../components/Pill';
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

      <Card tone="dark" className="mb-10">
        <p className="text-[0.7rem] uppercase tracking-[0.22em] text-white/55">
          {s({ en: 'Four acts, about three minutes', hi: 'चार भाग, लगभग तीन मिनट' })}
        </p>
        <h2 className="display mt-3" style={{ fontSize: 'clamp(1.6rem, 4.5vw, 2.8rem)' }}>
          {s({
            en: 'The message, the privacy proof, the photo, the scammer',
            hi: 'संदेश, प्राइवेसी का सबूत, फ़ोटो, और ठग',
          })}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-[1.5] text-white/70">
          {s({
            en: 'A guided run with the narration on screen and nothing to type. Every act runs the real pipeline.',
            hi: 'निर्देशित डेमो, स्क्रीन पर ही बोलने की लाइनें, कुछ टाइप नहीं करना। हर भाग असली पाइपलाइन चलाता है।',
          })}
        </p>
        <div className="mt-5">
          <PillLink to="/demo/run" tone="ghost" dot>
            {s(DEMO_UI.start)}
          </PillLink>
        </div>
      </Card>

      <ul className="grid gap-4 md:grid-cols-2">
        {DEMO_INPUTS.map((demo) => {
          const cached = cachedDemo(demo.id);
          const to =
            demo.route === '/protect' ? '/protect' : `/check?demo=${demo.id}`;

          return (
            <li key={demo.id}>
              <Card className="h-full">
                <h2 className="text-[1.15rem] font-semibold">{s(demo.title)}</h2>
                <p className="mt-3 max-h-40 overflow-hidden whitespace-pre-wrap rounded-2xl bg-canvas-soft p-3 text-sm leading-[1.5] text-ink-soft">
                  {demo.text}
                </p>
                {cached ? (
                  <p className="mt-3 text-xs text-ink-mute">
                    {s({
                      en: 'A recorded result is available if a live call fails.',
                      hi: 'लाइव कॉल विफल होने पर रिकॉर्ड किया नतीजा उपलब्ध है।',
                    })}{' '}
                    ({cached.source})
                  </p>
                ) : null}
                <Link to={to} className="pill pill-dark mt-4">
                  {s({ en: 'Run it', hi: 'चलाइए' })}
                </Link>
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
