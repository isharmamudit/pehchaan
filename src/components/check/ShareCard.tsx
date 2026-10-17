/**
 * Share card. Carries the verdict, the red-flag count and the top tactic names.
 * Never the message, never a link, never a personal detail.
 */

import { useRef, useState } from 'react';
import { renderCard, shareCard } from '../../lib/shareCard';
import { useLanguage } from '../../lib/language';
import { TACTICS, type TacticId } from '../../core/tactics';
import { VERDICT_LABELS } from '../../core/verdict';
import type { Verdict } from '../../core/types';
import { PillButton } from '../Pill';

export default function ShareCard({
  verdict,
  redFlagCount,
  topTactics,
  label,
}: {
  verdict: Verdict;
  redFlagCount: number;
  topTactics: TacticId[];
  label: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const { s, lang } = useLanguage();

  async function onShare() {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const blob = await renderCard(cardRef.current);
      await shareCard(blob);
    } catch {
      /* the user cancelled, or the browser refused; nothing else to do */
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PillButton tone="light" onClick={onShare}>
        {label}
      </PillButton>

      {/* Rendered off-screen, but not display:none, so html-to-image can draw it. */}
      <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden>
        <div
          ref={cardRef}
          className="flex h-[630px] w-[1200px] flex-col justify-between p-20 text-white"
          style={{ background: 'radial-gradient(120% 120% at 10% 0%, #1b1b26 0%, #09090d 60%)' }}
        >
          <div>
            <p className="text-2xl uppercase tracking-[0.3em] text-white/50">Pehchaan</p>
            <p className="mt-10 text-[5.5rem] font-semibold leading-none">
              {s(VERDICT_LABELS[verdict])}
            </p>
            <p className="mt-6 text-3xl text-white/70">
              {redFlagCount} {lang === 'hi' ? 'चेतावनी संकेत' : 'red flags'}
            </p>
          </div>

          <ul className="flex flex-wrap gap-4">
            {[...new Set(topTactics)].slice(0, 3).map((id) => (
              <li
                key={id}
                className="rounded-full border border-white/25 px-7 py-3 text-2xl text-white/85"
              >
                {TACTICS[id].name[lang]}
              </li>
            ))}
          </ul>

          <p className="text-2xl text-white/45">
            {lang === 'hi' ? 'पहचान से जाँचा गया' : 'Checked with Pehchaan'}
          </p>
        </div>
      </div>
    </>
  );
}
