/**
 * The hero's media card: a fictional scam SMS that highlights its own
 * manipulative phrases one by one, each naming a tactic and an evidence badge.
 * This mirrors exactly what the Check screen does with real input.
 */

import { useEffect, useMemo, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../lib/motion';
import { useLanguage } from '../lib/language';
import { HERO_DEMO, landing } from '../i18n/landing';

interface Segment {
  text: string;
  flag: number | null;
}

/** Split the message around each flagged phrase, in order of appearance. */
function segment(message: string, phrases: string[]): Segment[] {
  const out: Segment[] = [];
  let cursor = 0;

  phrases.forEach((phrase, index) => {
    const at = message.indexOf(phrase, cursor);
    if (at === -1) return;
    if (at > cursor) out.push({ text: message.slice(cursor, at), flag: null });
    out.push({ text: phrase, flag: index });
    cursor = at + phrase.length;
  });

  if (cursor < message.length) out.push({ text: message.slice(cursor), flag: null });
  return out;
}

export default function HeroCheckCard() {
  const { s, lang } = useLanguage();
  const rootRef = useRef<HTMLDivElement>(null);

  const message = s(HERO_DEMO.message);
  const flags = HERO_DEMO.flags;
  const segments = useMemo(
    () => segment(message, flags.map((f) => s(f.phrase))),
    [message, flags, s],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const marks = root.querySelectorAll<HTMLElement>('[data-mark]');
    const rows = root.querySelectorAll<HTMLElement>('[data-row]');
    const verdict = root.querySelector<HTMLElement>('[data-verdict]');

    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.set(marks, { '--fill': 0 });
      gsap.set(rows, { opacity: 0, y: 14 });
      gsap.set(verdict, { opacity: 0, y: 10 });

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 2.4, delay: 0.6 });

      marks.forEach((mark, i) => {
        tl.to(mark, { '--fill': 1, duration: 0.45, ease: 'power2.out' }, i * 0.75)
          .to(rows[i]!, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, i * 0.75 + 0.1);
      });

      tl.to(verdict, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '+=0.2')
        .to({}, { duration: 2.2 })
        .to([marks, rows, verdict], { opacity: 0, duration: 0.4, stagger: 0 })
        .set(marks, { '--fill': 0, opacity: 1 })
        .set(rows, { y: 14 })
        .set(verdict, { y: 10 });
    }, root);

    return () => ctx.revert();
  }, [lang, segments]);

  return (
    <div
      ref={rootRef}
      className="media-card relative flex h-full flex-col justify-between gap-8 p-6 text-white sm:p-10"
      style={{ background: 'radial-gradient(120% 120% at 15% 0%, #1b1b26 0%, #09090d 60%)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: 'var(--indigo)' }}
      />

      <div className="relative">
        <span className="text-[0.7rem] uppercase tracking-[0.22em] text-white/50">
          {s(landing.hero.demoLabel)}
        </span>

        <p
          className="mt-5 max-w-2xl text-balance leading-[1.5]"
          style={{ fontSize: 'clamp(1.05rem, 2.1vw, 1.6rem)' }}
        >
          {segments.map((seg, i) =>
            seg.flag === null ? (
              <span key={i}>{seg.text}</span>
            ) : (
              <span
                key={i}
                data-mark
                className="relative inline-block whitespace-pre-wrap"
                style={{ ['--fill' as string]: 1 }}
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 top-0 -z-0 origin-left rounded-[4px]"
                  style={{
                    background: 'rgba(47, 59, 245, 0.55)',
                    transform: 'scaleX(var(--fill))',
                  }}
                />
                <span className="relative z-10">{seg.text}</span>
              </span>
            ),
          )}
        </p>
      </div>

      <div className="relative grid gap-3 sm:grid-cols-2">
        {flags.map((flag, i) => (
          <div
            key={i}
            data-row
            className="flex items-start gap-3 rounded-2xl bg-white/[0.06] p-3 backdrop-blur-sm"
          >
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-semibold">
              {i + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{s(flag.tactic)}</span>
              <span className="mt-1 inline-flex rounded-full border border-white/25 px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-white/70">
                {s(flag.badge)}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div
        data-verdict
        className="relative flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-4"
        style={{ background: 'var(--danger)' }}
      >
        <span className="text-lg font-semibold">{s(landing.hero.demoVerdict)}</span>
        <span className="text-sm text-white/85">{s(landing.hero.demoCount)}</span>
      </div>
    </div>
  );
}
