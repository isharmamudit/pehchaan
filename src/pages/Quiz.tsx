/** Spot-the-scam quiz, sets A and B, used as a before/after test. */

import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Page, PageTitle } from '../components/ui';
import { PillButton, PillLink } from '../components/Pill';
import { gradeQuiz, quizSet, type QuizAnswer } from '../data/quiz';
import { TACTICS } from '../core/tactics';
import { quizResultsCsv, saveQuizResult } from '../lib/storage';
import { downloadBlob } from '../lib/image';
import { useLanguage } from '../lib/language';
import { t } from '../i18n';

const OPTIONS: QuizAnswer[] = ['scam', 'legit', 'not_sure'];

export default function Quiz() {
  const { set } = useParams();
  const { lang, s } = useLanguage();
  const strings = t(lang);

  const setId: 'a' | 'b' = set === 'b' ? 'b' : 'a';
  const items = useMemo(() => quizSet(setId), [setId]);

  const [answers, setAnswers] = useState<Record<string, QuizAnswer>>({});
  const [revealed, setRevealed] = useState(false);

  const graded = revealed ? gradeQuiz(setId, answers) : null;

  const labels: Record<QuizAnswer, string> = {
    scam: s({ en: 'Scam', hi: 'ठगी' }),
    legit: s({ en: 'Legit', hi: 'असली' }),
    not_sure: s({ en: 'Not sure', hi: 'पता नहीं' }),
  };

  function finish() {
    const result = gradeQuiz(setId, answers);
    saveQuizResult({
      set: setId,
      correct: result.correct,
      total: result.total,
      answers: result.perItem,
      date: new Date().toISOString(),
    });
    setRevealed(true);
  }

  return (
    <Page>
      <PageTitle sub={strings.practise.quizIntro}>
        {strings.practise.quiz} — {setId.toUpperCase()}
      </PageTitle>

      <ol className="space-y-5">
        {items.map((item, i) => {
          const answer = answers[item.id];
          const correct = answer === item.answer;

          return (
            <li key={item.id}>
              <Card>
                <span className="text-xs tabular-nums text-ink-mute">
                  {String(i + 1).padStart(2, '0')} / {items.length}
                </span>
                <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-canvas-soft p-4 text-[1rem] leading-[1.6]">
                  {s(item.text)}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={revealed}
                      aria-pressed={answer === option}
                      onClick={() => setAnswers((prev) => ({ ...prev, [item.id]: option }))}
                      className={`min-h-[44px] rounded-full px-5 text-sm transition-colors ${
                        answer === option ? 'bg-ink text-white' : 'bg-white/80 hover:bg-white'
                      } ${revealed ? 'opacity-70' : ''}`}
                    >
                      {labels[option]}
                    </button>
                  ))}
                </div>

                {revealed ? (
                  <div className="mt-4 rounded-2xl bg-white/70 p-4">
                    <p className="text-sm font-semibold">
                      {correct
                        ? s({ en: 'Correct', hi: 'सही' })
                        : s({ en: 'Not quite', hi: 'बिलकुल नहीं' })}{' '}
                      — {labels[item.answer]}
                    </p>
                    <p className="mt-2 text-sm leading-[1.5] text-ink-soft">{s(item.explanation)}</p>
                    {item.tactics.length ? (
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {item.tactics.map((tactic) => (
                          <li
                            key={tactic}
                            className="rounded-full bg-canvas-soft px-3 py-1 text-xs text-ink-soft"
                          >
                            {TACTICS[tactic].name[lang]}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {revealed && graded ? (
          <p className="display" style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)' }}>
            {graded.correct} / {graded.total}
          </p>
        ) : (
          <PillButton tone="dark" dot onClick={finish}>
            {s({ en: 'Reveal answers', hi: 'उत्तर देखिए' })}
          </PillButton>
        )}

        <PillButton
          tone="light"
          onClick={() =>
            downloadBlob(
              new Blob([quizResultsCsv()], { type: 'text/csv' }),
              'pehchaan-quiz.csv',
            )
          }
        >
          {strings.practise.exportCsv}
        </PillButton>

        <PillLink to={setId === 'a' ? '/practise' : '/practise/quiz/a'} tone="light">
          {setId === 'a'
            ? s({ en: 'Do a sparring round', hi: 'एक स्पारिंग राउंड कीजिए' })
            : s({ en: 'Back to quiz A', hi: 'क्विज़ A पर जाइए' })}
        </PillLink>
      </div>
    </Page>
  );
}
