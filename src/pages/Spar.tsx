/**
 * One sparring round. The user's turns pass through the privacy shield before
 * they are sent, scoring is computed in code, and the round always completes:
 * with no key, the persona's scripted dialogue takes over.
 */

import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Card, Notice, Page, Spinner } from '../components/ui';
import { PillButton, PillLink } from '../components/Pill';
import {
  applyTurn,
  HIGH_RISK_END_LINE,
  MAX_USER_TURNS,
  SCORE_CRITERIA,
  scoreSession,
  startSession,
  type SparSession,
} from '../core/sparring';
import { getDebrief, nextSparTurn } from '../lib/practise';
import { isPersonaId, PERSONAS, pickPersonalisedTemplate, type FactKind } from '../core/personas';
import { redact, totalMasked } from '../core/redact';
import { TACTICS } from '../core/tactics';
import { getProfile, saveProfile, saveSparScore } from '../lib/storage';
import { LEVER_NAME, recordRound, type Lever } from '../core/levers';
import PressureProfile from '../components/PressureProfile';
import { useLanguage } from '../lib/language';
import { t } from '../i18n';
import type { DebriefResponse } from '../core/contracts';

interface SparRouteState {
  knownFacts?: string[];
  factKinds?: FactKind[];
  /** Adaptive sparring: the lever this round should lean on. */
  targetLever?: Lever;
}

export default function Spar() {
  const { personaId } = useParams();
  const location = useLocation();
  const { lang, s } = useLanguage();
  const strings = t(lang);

  const state = (location.state ?? {}) as SparRouteState;
  const knownFacts = state.knownFacts ?? [];
  const targetLever = state.targetLever;
  const template = personaId === 'personalised'
    ? pickPersonalisedTemplate(state.factKinds ?? [])
    : null;

  const id = isPersonaId(personaId) ? personaId : 'bank_kyc';

  const [session, setSession] = useState<SparSession>(() =>
    startSession(id, lang, template ? template.opening[lang] : undefined),
  );
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [coaching, setCoaching] = useState(false);
  const [debrief, setDebrief] = useState<DebriefResponse | null>(null);
  const [debriefBusy, setDebriefBusy] = useState(false);
  const [profile, setProfile] = useState<ReturnType<typeof getProfile> | null>(null);

  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [session.messages.length]);

  async function send() {
    const text = draft.trim();
    if (!text || busy || session.ended) return;

    setCoaching(totalMasked(redact(text).counts) > 0);
    setBusy(true);
    setDraft('');

    const response = await nextSparTurn(session, text, {
      knownFacts,
      template: template?.key,
      targetLever,
    });
    setSession((prev) => applyTurn(prev, text, response));
    setBusy(false);
  }

  const score = session.ended
    ? scoreSession({
        tags: session.tags,
        userTexts: session.messages.filter((m) => m.role === 'user').map((m) => m.text),
      })
    : null;

  useEffect(() => {
    if (!session.ended || !score || debrief || debriefBusy) return;
    setDebriefBusy(true);
    saveSparScore({ personaId: id, score: score.total, date: new Date().toISOString() });

    // Adaptive sparring: remember which levers were pushed and whether they worked.
    const updated = recordRound(getProfile(), session.tacticsSeen, session.tags);
    saveProfile(updated);
    setProfile(updated);
    void getDebrief(session, knownFacts).then((result) => {
      setDebrief(result);
      setDebriefBusy(false);
    });
  }, [session, score, debrief, debriefBusy, id, knownFacts]);

  const persona = PERSONAS[id];

  return (
    <Page>
      <div
        className="mb-6 rounded-media px-5 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-white"
        style={{ background: 'var(--danger)' }}
      >
        {strings.practise.banner}
      </div>

      <h1 className="display mb-2" style={{ fontSize: 'clamp(1.8rem, 5vw, 3.4rem)' }}>
        {template ? s(PERSONAS.personalised.name) : s(persona.name)}
      </h1>
      <p className="mb-2 text-sm text-ink-soft">
        {strings.practise.turnsLeft(Math.max(0, MAX_USER_TURNS - session.userTurns))}
      </p>
      {targetLever ? (
        <p className="mb-8 inline-flex rounded-full bg-canvas-soft px-4 py-2 text-xs text-ink-soft">
          {s({ en: 'Targeting your weak spot:', hi: 'आपकी कमज़ोर कड़ी पर:' })}{' '}
          <strong className="ml-1">{s(LEVER_NAME[targetLever])}</strong>
        </p>
      ) : (
        <div className="mb-8" />
      )}

      <Card className="mb-6">
        <div ref={logRef} className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
          {session.messages.map((message, i) => (
            <div
              key={i}
              className={`max-w-[86%] rounded-2xl px-4 py-3 text-[0.98rem] leading-[1.5] ${
                message.role === 'user'
                  ? 'ml-auto bg-ink text-white'
                  : 'bg-canvas-soft text-ink'
              }`}
            >
              {message.text}
            </div>
          ))}
          {busy ? <Spinner label={lang === 'hi' ? 'जवाब आ रहा है…' : 'Replying…'} /> : null}
        </div>
      </Card>

      {coaching ? <Notice tone="warn">{strings.practise.coaching}</Notice> : null}

      {session.ended ? null : (
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 500))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            aria-label={strings.practise.yourTurn}
            placeholder={strings.practise.yourTurn}
            className="min-h-[52px] flex-1 rounded-full bg-white/80 px-5 text-[1rem] outline-none placeholder:text-ink-mute"
          />
          <PillButton tone="dark" dot onClick={() => void send()}>
            {strings.practise.send}
          </PillButton>
        </div>
      )}

      {session.ended && score ? (
        <section className="mt-10 space-y-6">
          {session.endReason === 'high_risk_compliance' ? (
            <Notice tone="error">{s(HIGH_RISK_END_LINE)}</Notice>
          ) : null}

          {session.usedFallback ? (
            <Notice>
              {s({
                en: 'This round used the scripted fallback, so it works with no AI service at all.',
                hi: 'यह राउंड स्क्रिप्टेड फ़ॉलबैक से चला, यानी बिना किसी एआई सेवा के भी काम करता है।',
              })}
            </Notice>
          ) : null}

          <Card>
            <h2 className="display mb-5" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)' }}>
              {strings.practise.scorecard}
            </h2>
            <ul className="space-y-3">
              {SCORE_CRITERIA.map((criterion) => (
                <li key={criterion.key} className="flex items-center justify-between gap-4">
                  <span className="text-sm">{s(criterion.label)}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {score[criterion.key]} / 25
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 display" style={{ fontSize: 'clamp(2.4rem, 7vw, 4.5rem)' }}>
              {score.total} / 100
            </p>
          </Card>

          {profile ? <PressureProfile profile={profile} /> : null}

          {debriefBusy ? <Spinner label={lang === 'hi' ? 'समीक्षा बन रही है…' : 'Writing the debrief…'} /> : null}

          {debrief ? (
            <Card>
              <h2 className="display mb-5" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)' }}>
                {strings.practise.debrief}
              </h2>

              {debrief.tactics_seen.length ? (
                <>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em]">
                    {strings.practise.tacticsSeen}
                  </h3>
                  <ul className="mb-6 space-y-2">
                    {debrief.tactics_seen.map((item, i) => (
                      <li key={i} className="rounded-2xl bg-white/70 p-3 text-sm">
                        <span className="font-semibold">{TACTICS[item.tactic].name[lang]}</span>
                        <span className="mt-1 block italic text-ink-soft">“{item.quote}”</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em]">
                {strings.practise.didWell}
              </h3>
              <ul className="mb-6 space-y-2 text-sm text-ink-soft">
                {debrief.did_well.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>

              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em]">
                {strings.practise.improve}
              </h3>
              <ul className="space-y-2 text-sm">
                {debrief.improve.map((item, i) => (
                  <li key={i} className="rounded-2xl bg-white/70 p-3">
                    <span className="block font-semibold">{item.moment}</span>
                    <span className="mt-1 block text-ink-soft">{item.safer_response}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <PillLink to="/practise" tone="dark" dot>
              {s({ en: 'Another round', hi: 'एक और राउंड' })}
            </PillLink>
            <PillLink to="/practise/quiz/b" tone="light">
              {s({ en: 'Take quiz B', hi: 'क्विज़ B दीजिए' })}
            </PillLink>
            <PillLink to="/help" tone="light">
              {strings.app.getHelp}
            </PillLink>
          </div>
        </section>
      ) : null}
    </Page>
  );
}
