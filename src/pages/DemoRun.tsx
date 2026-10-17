/**
 * The guided demo. Four acts, one Next button, nothing typed on stage.
 *
 * Every act runs the real product: the real pipeline, the real payload builder,
 * the real Post X-Ray and the real sparring engine. If a service is missing the
 * act says so rather than pretending, which is the point of the whole project.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Notice, Spinner } from '../components/ui';
import { PillButton, PillLink } from '../components/Pill';
import ResultView from '../components/check/ResultView';
import WhatLeftDevice from '../components/demo/WhatLeftDevice';
import PressureProfile from '../components/PressureProfile';
import { ACTS, DEMO_UI, SCRIPTED_REPLIES } from '../core/demoScript';
import { analyzeInput } from '../core/pipeline';
import { buildKnownFacts, type KnownFacts, type XrayFinding } from '../core/postXray';
import { localXray, remoteXray } from '../lib/protect';
import { nextSparTurn } from '../lib/practise';
import {
  applyTurn,
  scoreSession,
  startSession,
  type SparSession,
} from '../core/sparring';
import { pickPersonalisedTemplate } from '../core/personas';
import { emptyProfile, recordRound, type PressureProfile as Profile } from '../core/levers';
import { getProfile, saveProfile } from '../lib/storage';
import { demoInput } from '../demo/inputs';
import { useLanguage } from '../lib/language';
import type { AnalysisResult } from '../core/types';

const KYC = demoInput('kyc_sms')!;
const PHOTO = demoInput('post_xray_photo')!;

export default function DemoRun() {
  const { lang, s } = useLanguage();
  const [act, setAct] = useState(0);

  /* ------------------------------------------------------------- act one */
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (act !== 0 || analysis) return;
    void analyzeInput({
      text: KYC.text,
      inputType: KYC.inputType,
      lang,
    }).then(setAnalysis);
  }, [act, analysis, lang]);

  /* ----------------------------------------------------------- act three */
  const [xray, setXray] = useState<{
    findings: XrayFinding[];
    known: KnownFacts;
    visionUnavailable: boolean;
  } | null>(null);
  const [xrayBusy, setXrayBusy] = useState(false);

  const runXray = useCallback(async () => {
    if (xray || xrayBusy) return;
    setXrayBusy(true);

    const response = await fetch(PHOTO.asset!);
    const blob = await response.blob();
    const caption = PHOTO.text;

    const local = await localXray(blob, caption, lang);
    const remote = await remoteXray(blob, caption, lang);
    const findings = [...local.findings, ...remote.findings];

    setXray({
      findings,
      known: buildKnownFacts(findings, lang),
      visionUnavailable: remote.unavailable,
    });
    setXrayBusy(false);
  }, [xray, xrayBusy, lang]);

  useEffect(() => {
    if (act === 2) void runXray();
  }, [act, runXray]);

  /* ------------------------------------------------------------ act four */
  const [session, setSession] = useState<SparSession | null>(null);
  const [replyIndex, setReplyIndex] = useState(0);
  const [sparBusy, setSparBusy] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const template = pickPersonalisedTemplate(xray?.known.kinds ?? []);

  useEffect(() => {
    if (act !== 3 || session) return;
    setSession(startSession('personalised', lang, template.opening[lang]));
  }, [act, session, lang, template]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [session?.messages.length]);

  async function sendScripted() {
    if (!session || sparBusy || session.ended) return;
    const reply = SCRIPTED_REPLIES[replyIndex];
    if (!reply) return;

    setSparBusy(true);
    const text = s(reply);
    const response = await nextSparTurn(session, text, {
      knownFacts: xray?.known.facts ?? [],
      template: template.key,
    });

    const updated = applyTurn(session, text, response);
    setSession(updated);
    setReplyIndex((i) => i + 1);
    setSparBusy(false);

    if (updated.ended) {
      // On stage the story has to be clean, so the panel shows this round
      // alone. The real profile is still updated, just not displayed here.
      saveProfile(recordRound(getProfile(), updated.tacticsSeen, updated.tags));
      setProfile(recordRound(emptyProfile(), updated.tacticsSeen, updated.tags));
    }
  }

  const score = session?.ended
    ? scoreSession({
        tags: session.tags,
        userTexts: session.messages.filter((m) => m.role === 'user').map((m) => m.text),
      })
    : null;

  /* -------------------------------------------------------------- chrome */
  const current = ACTS[act]!;
  const last = act === ACTS.length - 1;

  const go = useCallback(
    (delta: number) => setAct((i) => Math.min(ACTS.length - 1, Math.max(0, i + delta))),
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.tagName;
      if (typing === 'INPUT' || typing === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        go(1);
      }
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  // Block body on purpose: Lenis patches window.scrollTo and returns a value,
  // which React would otherwise try to call as a cleanup function.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [act]);

  return (
    <main id="main" className="edge pb-28 pt-24 sm:pt-28">
      {/* progress */}
      <div className="mb-8 flex items-center gap-2">
        {ACTS.map((a, i) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAct(i)}
            aria-label={s(a.title)}
            aria-current={i === act}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{ background: i <= act ? 'var(--ink)' : 'var(--canvas-soft)' }}
          />
        ))}
        <span className="ml-3 shrink-0 text-xs tabular-nums text-ink-mute">
          {act + 1} / {ACTS.length} · ~{current.seconds}s
        </span>
      </div>

      <header className="mb-6">
        <p className="text-[0.7rem] uppercase tracking-[0.22em] text-ink-mute">
          {s(current.kicker)}
        </p>
        <h1 className="display mt-3" style={{ fontSize: 'clamp(2rem, 6vw, 4.2rem)' }}>
          {s(current.title)}
        </h1>
      </header>

      {/* presenter note */}
      <section className="mb-8 rounded-media bg-night p-5 text-white sm:p-6">
        <p className="text-[0.62rem] uppercase tracking-[0.2em] text-white/45">
          {s(DEMO_UI.say)}
        </p>
        <p className="mt-2 text-[1.05rem] leading-[1.5]">{s(current.narration)}</p>
        <p className="mt-3 border-t border-white/10 pt-3 text-xs text-white/50">
          {s(DEMO_UI.presenter)}: {s(current.beat)}
        </p>
      </section>

      {/* ------------------------------------------------------------ stage */}
      {act === 0 ? (
        analysis ? (
          <ResultView
            result={analysis}
            counts={`${analysis.findings.length} · ${
              analysis.findings.filter((f) => f.evidence === 'rule').length
            } rule`}
            cached={false}
            activeId={null}
            onSelect={() => {}}
            onReset={() => setAnalysis(null)}
          />
        ) : (
          <Spinner label={s(DEMO_UI.running)} />
        )
      ) : null}

      {act === 1 ? <WhatLeftDevice text={KYC.text} inputType={KYC.inputType} /> : null}

      {act === 2 ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <figure className="overflow-hidden rounded-media bg-night">
              <img src={PHOTO.asset} alt="" className="w-full" />
              <figcaption className="p-5 text-sm text-white/75">“{PHOTO.text}”</figcaption>
            </figure>

            <div className="space-y-3">
              {xrayBusy ? <Spinner label={s(DEMO_UI.running)} /> : null}

              {xray?.visionUnavailable ? (
                <Notice tone="warn">
                  {s({
                    en: 'Photo reading is unavailable, so only the on-device caption and metadata checks ran. Everything below was found without sending anything.',
                    hi: 'फ़ोटो पढ़ना उपलब्ध नहीं, इसलिए सिर्फ़ डिवाइस पर कैप्शन और मेटाडेटा जाँच चली। नीचे सब कुछ बिना कुछ भेजे मिला है।',
                  })}
                </Notice>
              ) : null}

              {xray?.known.facts.length ? (
                <div className="rounded-media bg-night p-5 text-white">
                  <p className="text-[0.62rem] uppercase tracking-[0.2em] text-white/45">
                    {s({ en: 'What a stranger now knows', hi: 'अब एक अजनबी क्या जानता है' })}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {xray.known.facts.map((fact, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 rounded-xl border border-white/15 px-4 py-2.5 text-[0.98rem]"
                      >
                        <span className="text-xs tabular-nums text-white/35">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {xray?.findings.length ? (
                <ul className="space-y-2">
                  {xray.findings.slice(0, 4).map((finding) => (
                    <li key={finding.id} className="rounded-2xl bg-white/70 p-4">
                      <p className="text-sm font-semibold capitalize">{finding.title}</p>
                      {finding.text ? (
                        <p className="mt-1 text-sm italic text-ink-soft">“{finding.text}”</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {act === 3 && session ? (
        <div className="space-y-5">
          <div
            className="rounded-media px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white"
            style={{ background: 'var(--danger)' }}
          >
            {s({
              en: 'Training simulation · fictional scammer · built only from the facts in act three',
              hi: 'प्रशिक्षण सिम्युलेशन · काल्पनिक ठग · सिर्फ़ तीसरे भाग की बातों से बना',
            })}
          </div>

          <div ref={logRef} className="max-h-[46vh] space-y-3 overflow-y-auto rounded-media bg-white/60 p-5">
            {session.messages.map((message, i) => (
              <div
                key={i}
                className={`max-w-[86%] rounded-2xl px-4 py-3 text-[0.98rem] leading-[1.5] ${
                  message.role === 'user' ? 'ml-auto bg-ink text-white' : 'bg-canvas-soft'
                }`}
              >
                {message.text}
              </div>
            ))}
            {sparBusy ? <Spinner label={s(DEMO_UI.running)} /> : null}
          </div>

          {!session.ended && replyIndex < SCRIPTED_REPLIES.length ? (
            <div className="flex flex-wrap items-center gap-3">
              <PillButton tone="dark" dot onClick={() => void sendScripted()}>
                {s(DEMO_UI.sendReply)}
              </PillButton>
              <span className="text-sm text-ink-mute">
                “{s(SCRIPTED_REPLIES[replyIndex]!)}”
              </span>
            </div>
          ) : null}

          {score ? (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-media bg-white/70 p-6">
                <h2 className="display" style={{ fontSize: 'clamp(1.4rem, 3.6vw, 2.2rem)' }}>
                  {score.total} / 100
                </h2>
                <p className="mt-2 text-sm text-ink-soft">
                  {s({
                    en: 'Scored in code, on what actually keeps people safe: spotting it, refusing, verifying, leaving early.',
                    hi: 'अंक कोड देता है, उसी पर जो असल में बचाता है: पहचानना, मना करना, जाँचना, जल्दी निकलना।',
                  })}
                </p>
              </div>
              {profile ? <PressureProfile profile={profile} compact /> : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ----------------------------------------------------------- footer */}
      <nav className="mt-12 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-6">
        <PillButton tone="light" onClick={() => go(-1)}>
          {s(DEMO_UI.back)}
        </PillButton>

        {last ? (
          <>
            <PillLink to="/check" tone="dark" dot>
              {s({ en: 'Try it yourself', hi: 'ख़ुद आज़माइए' })}
            </PillLink>
            <span className="text-sm text-ink-soft">{s(DEMO_UI.finished)}</span>
          </>
        ) : (
          <PillButton tone="dark" dot onClick={() => go(1)}>
            {s(DEMO_UI.next)}
          </PillButton>
        )}

        <Link to="/demo" className="ml-auto text-sm underline underline-offset-4">
          {s(DEMO_UI.exit)}
        </Link>
      </nav>

      <p className="mt-4 text-xs text-ink-mute">{s(DEMO_UI.hint)}</p>
    </main>
  );
}
