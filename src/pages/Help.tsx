/** Get Help Now: situation picker, then ordered steps with official links. */

import { useState } from 'react';
import { Card, Notice, Page, PageTitle } from '../components/ui';
import { PillLink } from '../components/Pill';
import { HELP_FOOTER, HELPLINES, SITUATIONS, type SituationId } from '../config/help';
import { useLanguage } from '../lib/language';
import { t } from '../i18n';

export default function Help() {
  const { lang, s } = useLanguage();
  const strings = t(lang);
  const [picked, setPicked] = useState<SituationId | null>(null);

  const situation = SITUATIONS.find((item) => item.id === picked) ?? null;

  return (
    <Page>
      <PageTitle
        sub={s({
          en: 'Pick what happened. The steps are in the order that actually helps.',
          hi: 'जो हुआ वह चुनिए। क़दम उसी क्रम में हैं जो असल में काम आता है।',
        })}
      >
        {strings.help.title}
      </PageTitle>

      <div className="mb-8 flex flex-wrap gap-2">
        <PillLink href={HELPLINES.cyberFraud.tel} tone="dark" dot>
          {s({ en: 'Call 1930 now', hi: 'अभी 1930 पर कॉल कीजिए' })}
        </PillLink>
        <PillLink href={HELPLINES.cyberPortal} tone="light">
          cybercrime.gov.in
        </PillLink>
        <PillLink href={HELPLINES.chakshu} tone="light">
          {s({ en: 'Chakshu (report a call)', hi: 'चक्षु (कॉल की रिपोर्ट)' })}
        </PillLink>
      </div>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em]">{strings.help.pick}</h2>

      <ul className="grid gap-3 md:grid-cols-2">
        {SITUATIONS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setPicked(item.id === picked ? null : item.id)}
              aria-expanded={item.id === picked}
              className={`w-full rounded-media p-5 text-left transition-colors ${
                item.id === picked ? 'bg-ink text-white' : 'bg-white/70 hover:bg-white'
              }`}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="text-[1.1rem] font-semibold leading-[1.3]">{s(item.title)}</span>
                {item.urgency === 'high' ? (
                  <span
                    className="mt-1 shrink-0 rounded-full px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.14em] text-white"
                    style={{ background: 'var(--danger)' }}
                  >
                    {s({ en: 'Urgent', hi: 'ज़रूरी' })}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {situation ? (
        <Card className="mt-8">
          <h3 className="display mb-5" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)' }}>
            {s(situation.title)}
          </h3>
          <ol className="space-y-3">
            {situation.steps.map((step, i) => (
              <li key={i} className="flex gap-4 rounded-2xl bg-white/70 p-4">
                <span className="text-xs tabular-nums text-ink-mute">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[1rem] leading-[1.5]">
                  {s(step.text)}
                  {step.tel ? (
                    <a
                      className="ml-2 inline-block font-semibold underline underline-offset-4"
                      href={step.tel}
                    >
                      {strings.help.call}
                    </a>
                  ) : null}
                  {step.href ? (
                    <a
                      className="ml-2 inline-block font-semibold underline underline-offset-4"
                      href={step.href}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {strings.help.open}
                    </a>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}

      <div className="mt-8">
        <Notice>{s(HELP_FOOTER)}</Notice>
      </div>
    </Page>
  );
}
