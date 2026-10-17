/** The nine tactics, the evidence badges, the privacy promises and the limits. */

import { Card, EVIDENCE_HELP, EvidenceBadge, Page, PageTitle } from '../components/ui';
import { PillLink } from '../components/Pill';
import { TACTIC_IDS, TACTICS } from '../core/tactics';
import { OFFICIAL_SOURCES } from '../config/officialSources';
import { useLanguage } from '../lib/language';
import { landing } from '../i18n/landing';
import type { Evidence } from '../core/types';

const EVIDENCES: Evidence[] = ['rule', 'service', 'source', 'ai'];

export default function HowItWorks() {
  const { lang, s } = useLanguage();

  return (
    <Page>
      <PageTitle sub={s(landing.statement.body)}>
        {s({ en: 'How it works', hi: 'यह कैसे काम करता है' })}
      </PageTitle>

      <section className="mb-14">
        <h2 className="display mb-6" style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)' }}>
          {s(landing.tactics.kicker)}
        </h2>
        <ol className="grid gap-3 md:grid-cols-2">
          {TACTIC_IDS.map((id, i) => (
            <li key={id} className="rounded-media bg-white/70 p-5">
              <div className="flex items-baseline gap-3">
                <span className="text-xs tabular-nums text-ink-mute">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-[1.15rem] font-semibold">{TACTICS[id].name[lang]}</h3>
              </div>
              <p className="mt-2 text-sm leading-[1.5] text-ink-soft">{TACTICS[id].oneLiner[lang]}</p>
              <p className="mt-3 rounded-xl bg-canvas-soft px-3 py-2 text-sm italic text-ink-soft">
                “{TACTICS[id].example[lang]}”
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-14">
        <h2 className="display mb-6" style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)' }}>
          {s({ en: 'What each badge means', hi: 'हर बैज का मतलब' })}
        </h2>
        <ul className="space-y-3">
          {EVIDENCES.map((evidence) => (
            <li key={evidence} className="flex flex-wrap items-center gap-4 rounded-2xl bg-white/70 p-4">
              <EvidenceBadge evidence={evidence} />
              <span className="text-sm text-ink-soft">{s(EVIDENCE_HELP[evidence])}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-soft">
          {s({
            en: 'The badge is set by where a finding came from, in code. The AI never chooses its own badge, and a quote it cannot produce from your text is dropped before you see it.',
            hi: 'बैज इस आधार पर कोड तय करता है कि नतीजा कहाँ से आया। एआई अपना बैज ख़ुद नहीं चुनता, और जो वाक्य आपके टेक्स्ट में नहीं है वह दिखने से पहले हटा दिया जाता है।',
          })}
        </p>
      </section>

      <section className="mb-14">
        <h2 className="display mb-6" style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)' }}>
          {s(landing.footer.promises)}
        </h2>
        <Card>
          <ul className="space-y-3 text-[1rem] leading-[1.5] text-ink-soft">
            {landing.footer.promiseList.map((promise, i) => (
              <li key={i}>• {s(promise)}</li>
            ))}
            <li>
              •{' '}
              {s({
                en: 'Rules, the privacy shield, photo metadata and QR decoding all run on your device.',
                hi: 'नियम, प्राइवेसी शील्ड, फ़ोटो मेटाडेटा और क्यूआर डिकोडिंग — सब आपके डिवाइस पर चलते हैं।',
              })}
            </li>
            <li>
              •{' '}
              {s({
                en: 'Only redacted text, a URL list, or a re-encoded image ever reaches the server.',
                hi: 'सर्वर तक सिर्फ़ छिपाया हुआ टेक्स्ट, लिंक की सूची, या दोबारा बनाई गई तस्वीर पहुँचती है।',
              })}
            </li>
          </ul>
        </Card>
      </section>

      <section className="mb-14">
        <h2 className="display mb-6" style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)' }}>
          {s({ en: 'Limitations', hi: 'सीमाएँ' })}
        </h2>
        <p className="max-w-3xl text-[1rem] leading-[1.55] text-ink-soft">
          {s({
            en: 'No tool catches everything. New scams appear every week, a clean result is not a guarantee, and we never tell you a message is safe. When money or personal details are involved, verify through an official channel yourself.',
            hi: 'कोई भी टूल सब कुछ नहीं पकड़ता। हर हफ़्ते नई ठगी आती है, साफ़ नतीजा कोई गारंटी नहीं, और हम कभी नहीं कहते कि कोई संदेश सुरक्षित है। पैसे या निजी जानकारी शामिल हो तो आधिकारिक माध्यम से ख़ुद जाँच कीजिए।',
          })}
        </p>
      </section>

      <section className="mb-14">
        <h2 className="display mb-6" style={{ fontSize: 'clamp(1.8rem, 5vw, 3.2rem)' }}>
          {s({ en: 'Data sources', hi: 'डेटा स्रोत' })}
        </h2>
        <ul className="space-y-2 text-sm">
          <li>Google Safe Browsing Lookup API</li>
          <li>Google Fact Check Tools API</li>
          <li>Google Gemini (explanations only)</li>
          {Object.values(OFFICIAL_SOURCES).map((source) => (
            <li key={source.url}>
              <a
                className="underline underline-offset-4"
                href={source.url}
                target="_blank"
                rel="noreferrer noopener"
              >
                {s(source.name)}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-2">
        <PillLink to="/check" tone="dark" dot>
          {s({ en: 'Check a message', hi: 'संदेश जाँचिए' })}
        </PillLink>
        <PillLink to="/practise" tone="light">
          {s({ en: 'Practise', hi: 'अभ्यास' })}
        </PillLink>
      </div>
    </Page>
  );
}
