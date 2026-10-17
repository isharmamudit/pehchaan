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

      <div className="mb-6 rounded-3xl bg-danger p-5 sm:p-6 text-white shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              {s({ en: 'Emergency Helpline', hi: 'आपातकालीन हेल्पलाइन' })}
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">1930</h2>
            <p className="mt-1 text-xs sm:text-sm text-white/90 max-w-sm">
              {s({
                en: 'Call immediately if money was deducted. The first 2 hours are the golden window.',
                hi: 'पैसे कटने पर तुरंत कॉल करें। पहले 2 घंटे पैसे वापस रुकवाने के लिए सबसे महत्वपूर्ण हैं।',
              })}
            </p>
          </div>
          <a
            href={HELPLINES.cyberFraud.tel}
            className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-danger shadow-md transition-transform active:scale-95 hover:bg-white/90"
            aria-label="Call 1930"
          >
            <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </a>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <PillLink href={HELPLINES.cyberPortal} tone="light">
          cybercrime.gov.in
        </PillLink>
        <PillLink href={HELPLINES.chakshu} tone="light">
          {s({ en: 'Chakshu (report a call)', hi: 'चक्षु (कॉल की रिपोर्ट)' })}
        </PillLink>
      </div>

      <h2 className="mb-3 text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-ink-mute">
        {strings.help.pick}
      </h2>

      <ul className="grid gap-2.5 sm:gap-3 md:grid-cols-2">
        {SITUATIONS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setPicked(item.id === picked ? null : item.id)}
              aria-expanded={item.id === picked}
              className={`w-full rounded-2xl p-4 sm:p-5 text-left transition-all active:scale-[0.99] ${
                item.id === picked
                  ? 'bg-ink text-white shadow-md'
                  : 'bg-white/95 text-ink border border-line/15 shadow-sm hover:bg-white'
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
