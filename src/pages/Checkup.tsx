/** Privacy Check-up: 12 questions, a score out of 100 and a prioritised fix list. */

import { useState } from 'react';
import { Card, Page, PageTitle } from '../components/ui';
import { PillButton, PillLink } from '../components/Pill';
import { CHECKUP_QUESTIONS, scoreCheckup, type CheckupAnswer } from '../core/checkup';
import { checkPassword, K_ANONYMITY_NOTE } from '../lib/pwned';
import { useLanguage } from '../lib/language';
import { t } from '../i18n';

export default function Checkup() {
  const { lang, s } = useLanguage();
  const strings = t(lang);

  const [answers, setAnswers] = useState<Record<string, 0 | 1 | 2>>({});
  const [done, setDone] = useState(false);
  const [password, setPassword] = useState('');
  const [breach, setBreach] = useState<string | null>(null);

  const list: CheckupAnswer[] = Object.entries(answers).map(([questionId, optionIndex]) => ({
    questionId,
    optionIndex,
  }));
  const result = done ? scoreCheckup(list) : null;

  async function onCheckPassword() {
    if (!password) return;
    const outcome = await checkPassword(password);
    setPassword('');
    if (!outcome.ok) {
      setBreach(s({ en: 'Could not reach the service.', hi: 'सेवा तक नहीं पहुँच सके।' }));
      return;
    }
    setBreach(
      outcome.count > 0
        ? s({
            en: `Seen in ${outcome.count.toLocaleString()} known breaches. Change it everywhere you used it.`,
            hi: `${outcome.count.toLocaleString()} ज्ञात लीक में मिला। जहाँ-जहाँ इस्तेमाल किया है, बदल दीजिए।`,
          })
        : s({
            en: 'Not found in known breaches. That is not the same as a strong password.',
            hi: 'ज्ञात लीक में नहीं मिला। इसका मतलब यह नहीं कि पासवर्ड मज़बूत है।',
          }),
    );
  }

  return (
    <Page>
      <PageTitle
        sub={s({
          en: 'Twelve questions, answered on your device. Nothing is sent and nothing is stored.',
          hi: 'बारह सवाल, आपके डिवाइस पर। कुछ भेजा नहीं जाता और कुछ सेव नहीं होता।',
        })}
      >
        {strings.protect.checkup}
      </PageTitle>

      <ol className="space-y-4">
        {CHECKUP_QUESTIONS.map((question, i) => (
          <li key={question.id}>
            <Card>
              <span className="text-xs tabular-nums text-ink-mute">
                {String(i + 1).padStart(2, '0')} / {CHECKUP_QUESTIONS.length}
              </span>
              <p className="mt-2 text-[1.05rem] leading-[1.4]">{s(question.question)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-pressed={answers[question.id] === index}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [question.id]: index as 0 | 1 | 2 }))
                    }
                    className={`min-h-[44px] rounded-full px-5 text-sm transition-colors ${
                      answers[question.id] === index ? 'bg-ink text-white' : 'bg-white/80 hover:bg-white'
                    }`}
                  >
                    {s(option.label)}
                  </button>
                ))}
              </div>
            </Card>
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <PillButton tone="dark" dot onClick={() => setDone(true)}>
          {s({ en: 'See my score', hi: 'मेरा स्कोर देखिए' })}
        </PillButton>
      </div>

      {result ? (
        <section className="mt-10 space-y-6">
          <Card>
            <p className="display" style={{ fontSize: 'clamp(2.6rem, 8vw, 5rem)' }}>
              {strings.protect.yourScore(result.score)}
            </p>
          </Card>

          {result.checklist.length ? (
            <>
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">
                {strings.protect.checklist}
              </h2>
              <ol className="space-y-4">
                {result.checklist.map((item) => (
                  <li key={item.questionId}>
                    <Card>
                      <h3 className="text-[1.1rem] font-semibold">{s(item.title)}</h3>
                      <ol className="mt-3 space-y-2 text-sm text-ink-soft">
                        {item.steps.map((step, i) => (
                          <li key={i}>
                            {i + 1}. {s(step)}
                          </li>
                        ))}
                      </ol>
                      {item.link ? (
                        <a
                          className="mt-3 inline-block text-sm font-semibold underline underline-offset-4"
                          href={item.link.url}
                          target="_blank"
                          rel="noreferrer noopener"
                        >
                          {item.link.label}
                        </a>
                      ) : null}
                    </Card>
                  </li>
                ))}
              </ol>
            </>
          ) : null}
        </section>
      ) : null}

      <section className="mt-12">
        <Card>
          <h2 className="text-[1.1rem] font-semibold">
            {s({ en: 'Has a password of yours leaked?', hi: 'क्या आपका कोई पासवर्ड लीक हुआ है?' })}
          </h2>
          <p className="mt-2 text-sm text-ink-soft">{s(K_ANONYMITY_NOTE)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              aria-label={s({ en: 'Password to check', hi: 'जाँचने के लिए पासवर्ड' })}
              className="min-h-[48px] flex-1 rounded-full bg-white/80 px-5 outline-none"
            />
            <PillButton tone="light" onClick={() => void onCheckPassword()}>
              {s({ en: 'Check', hi: 'जाँचिए' })}
            </PillButton>
          </div>
          {breach ? <p className="mt-3 text-sm font-semibold">{breach}</p> : null}
        </Card>
      </section>

      <div className="mt-8">
        <PillLink to="/protect" tone="light">
          {strings.protect.title}
        </PillLink>
      </div>
    </Page>
  );
}
