/**
 * Route stubs. The logic behind every one of these screens is already built
 * and tested in src/core; only the interface is still to come.
 */

import { PillLink } from '../components/Pill';
import { useLanguage } from '../lib/language';
import type { Localised } from '../core/tactics';

const L = (en: string, hi: string): Localised => ({ en, hi });

const NOTE = L(
  'This screen is next. Its logic — rules, privacy shield, verdicts, scoring — is already built and tested.',
  'यह स्क्रीन अगली है। इसका तर्क — नियम, प्राइवेसी शील्ड, नतीजे, स्कोरिंग — पहले से बना और जाँचा हुआ है।',
);

export default function Placeholder({ title }: { title: Localised }) {
  const { s } = useLanguage();

  return (
    <main id="main" className="edge flex min-h-[80vh] flex-col justify-center py-32">
      <h1 className="display" style={{ fontSize: 'clamp(2.6rem, 9vw, 7rem)' }}>
        {s(title)}
      </h1>
      <p className="mt-6 max-w-xl text-[1.05rem] leading-[1.5] text-ink-soft">{s(NOTE)}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <PillLink to="/" tone="dark" dot>
          {s(L('Back to home', 'होम पर जाइए'))}
        </PillLink>
        <PillLink href="tel:1930" tone="light">
          {s(L('Call 1930', '1930 पर कॉल कीजिए'))}
        </PillLink>
      </div>
    </main>
  );
}
