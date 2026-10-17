/** Persona picker and the before/after quiz entry. */

import { Link } from 'react-router-dom';
import { Card, Page, PageTitle } from '../components/ui';
import { PillLink } from '../components/Pill';
import { PERSONA_IDS, PERSONAS, personaForLever, personaLevers } from '../core/personas';
import { LEVER_NAME, weakestLever } from '../core/levers';
import { TACTICS } from '../core/tactics';
import PressureProfile from '../components/PressureProfile';
import { bestSparScore, getProfile } from '../lib/storage';
import { useLanguage } from '../lib/language';
import { t } from '../i18n';

export default function Practise() {
  const { lang, s } = useLanguage();
  const strings = t(lang);
  const best = bestSparScore();
  const profile = getProfile();
  const weakest = weakestLever(profile);
  const recommended = weakest ? personaForLever(weakest) : null;

  return (
    <Page>
      <PageTitle sub={strings.practise.subtitle}>{strings.practise.title}</PageTitle>

      <div
        className="mb-8 rounded-media px-5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white"
        style={{ background: 'var(--danger)' }}
      >
        {strings.practise.banner}
      </div>

      {best !== null ? (
        <p className="mb-6 text-sm text-ink-soft">{strings.practise.best(best)}</p>
      ) : null}

      {weakest && recommended ? (
        <Card className="mb-8" tone="dark">
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-white/55">
            {s({ en: 'Adaptive sparring', hi: 'अनुकूल अभ्यास' })}
          </p>
          <h2 className="display mt-3" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.4rem)' }}>
            {s({ en: 'Train your weak spot:', hi: 'अपनी कमज़ोर कड़ी पर अभ्यास:' })}{' '}
            {s(LEVER_NAME[weakest])}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-[1.5] text-white/70">
            {s({
              en: 'The next round leans on the pressure you have given in to before, instead of the one you already resist.',
              hi: 'अगला राउंड उसी दबाव पर ज़ोर देगा जिसके आगे आप पहले झुके हैं, न कि उस पर जिसे आप पहले ही झेल लेते हैं।',
            })}
          </p>
          <Link
            to={`/practise/${recommended}`}
            state={{ targetLever: weakest }}
            className="pill pill-ghost mt-5"
          >
            {s({ en: 'Start targeted round', hi: 'लक्षित राउंड शुरू कीजिए' })}
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
          </Link>
        </Card>
      ) : null}

      <PressureProfile profile={profile} compact />

      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {PERSONA_IDS.filter((id) => id !== 'personalised').map((id) => {
          const persona = PERSONAS[id];
          return (
            <li key={id} className="rounded-media bg-white/70 p-6">
              <h2 className="display" style={{ fontSize: 'clamp(1.5rem, 3.6vw, 2.3rem)' }}>
                {s(persona.name)}
              </h2>
              <p className="mt-3 text-sm leading-[1.5] text-ink-soft">{s(persona.blurb)}</p>

              <ul className="mt-4 flex flex-wrap gap-2">
                {personaLevers(id).map((lever) => (
                  <li
                    key={lever}
                    className="rounded-full bg-ink px-3 py-1 text-xs text-white"
                  >
                    {s(LEVER_NAME[lever])}
                  </li>
                ))}
                {persona.tactics.slice(0, 3).map((tactic) => (
                  <li
                    key={tactic}
                    className="rounded-full bg-canvas-soft px-3 py-1 text-xs text-ink-soft"
                  >
                    {TACTICS[tactic].name[lang]}
                  </li>
                ))}
              </ul>

              <div className="mt-5">
                <PillLink to={`/practise/${id}`} tone="dark" dot>
                  {strings.practise.start}
                </PillLink>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="mt-14 rounded-media bg-white/70 p-6">
        <h2 className="display" style={{ fontSize: 'clamp(1.5rem, 3.6vw, 2.3rem)' }}>
          {strings.practise.quiz}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-[1.5] text-ink-soft">
          {strings.practise.quizIntro}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <PillLink to="/practise/quiz/a" tone="dark" dot>
            {s({ en: 'Quiz A', hi: 'क्विज़ A' })}
          </PillLink>
          <PillLink to="/practise/quiz/b" tone="light">
            {s({ en: 'Quiz B', hi: 'क्विज़ B' })}
          </PillLink>
        </div>
      </section>
    </Page>
  );
}
