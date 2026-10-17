/**
 * Landing page. Sections, in order:
 *   hero → statement + ribbon → paste band → three ways → evidence + ribbon
 *   → attacker's view (dark) → tactics marquee → CTA → footer
 */

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { PillLink } from '../components/Pill';
import HeroCheckCard from '../components/HeroCheckCard';
import Ribbon from '../components/Ribbon';
import TacticsMarquee from '../components/TacticsMarquee';
import { revealOnEnter, scrollToTop, splitWords, prefersReducedMotion } from '../lib/motion';
import { useLanguage } from '../lib/language';
import { landing } from '../i18n/landing';
import { HELPLINES } from '../config/help';
import type { Localised } from '../core/tactics';

/* ------------------------------------------------------------------ pieces */

function PlusRow({ tone = 'ink' }: { tone?: 'ink' | 'white' }) {
  return (
    <div
      aria-hidden
      className="flex items-center justify-between opacity-40"
      style={{ color: tone === 'white' ? '#fff' : 'var(--ink)' }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="text-lg leading-none">
          +
        </span>
      ))}
    </div>
  );
}

function BigLines({ lines, className = '' }: { lines: string[]; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const spans = Array.from(el.querySelectorAll<HTMLElement>('[data-line]')).flatMap((line) =>
      splitWords(line),
    );

    return revealOnEnter(el, spans, { y: 40, stagger: 0.06, duration: 0.9 });
  }, [lines.join('|')]);

  return (
    <h2 ref={ref} className={`display ${className}`} style={{ fontSize: 'clamp(2.6rem, 9vw, 9rem)' }}>
      {lines.map((line, i) => (
        <span key={i} data-line className="block">
          {line}
        </span>
      ))}
    </h2>
  );
}

interface WayCard {
  to: string;
  tags: Localised;
  title: Localised;
  body: Localised;
  accent: string;
}

/* ----------------------------------------------------------------- landing */

export default function Landing() {
  const { s } = useLanguage();
  const waysRef = useRef<HTMLDivElement>(null);
  const factsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const stops = [
      revealOnEnter(waysRef.current, waysRef.current?.children ?? [], { y: 60, stagger: 0.1 }),
      revealOnEnter(factsRef.current, factsRef.current?.children ?? [], { y: 28, stagger: 0.08 }),
    ];
    return () => stops.forEach((stop) => stop());
  }, []);

  const ways: WayCard[] = [
    { to: '/check', ...landing.ways.check, accent: 'var(--indigo)' },
    { to: '/practise', ...landing.ways.practise, accent: 'var(--cyan)' },
    { to: '/protect', ...landing.ways.protect, accent: 'var(--indigo-deep)' },
    { to: '/help', ...landing.ways.help, accent: 'var(--danger)' },
  ];

  return (
    <main id="main">
      {/* ------------------------------------------------------------- hero */}
      <section className="edge pt-28 sm:pt-32">
        <p className="ml-auto max-w-2xl text-balance text-[1.05rem] leading-[1.35] sm:text-[1.5rem] md:text-[1.75rem]">
          {s(landing.hero.tagline)}
        </p>

        <div className="mt-8 h-[clamp(420px,72vh,760px)]">
          <HeroCheckCard />
        </div>

        <div className="mt-4 flex items-center gap-6">
          <PlusRow />
        </div>

        <div className="mt-2 flex justify-center pb-16">
          <span className="text-[0.7rem] uppercase tracking-[0.22em] text-ink-mute">
            {s(landing.hero.scroll)}
          </span>
        </div>
      </section>

      {/* -------------------------------------------------------- statement */}
      <section className="relative overflow-hidden py-16 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[6%] h-[58%] sm:top-0 sm:h-[66%]"
        >
          <Ribbon
            d="M -70 560 C 150 560 120 150 430 140 C 720 130 800 330 1270 250"
            color="var(--indigo)"
            width={96}
          />
        </div>

        <div className="edge relative z-10">
          <BigLines lines={[s(landing.statement.line1), s(landing.statement.line2)]} />

          <div className="mt-10 grid gap-8 md:grid-cols-[1fr_minmax(320px,46%)] md:items-end">
            <div />
            <div>
              <p className="text-[1.02rem] leading-[1.55] text-ink-soft">{s(landing.statement.body)}</p>
              <div className="mt-6">
                <PillLink to="/how-it-works" tone="light" dot>
                  {s(landing.statement.cta)}
                </PillLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- paste band */}
      <section className="edge py-10">
        <PlusRow />
        <Link
          to="/check"
          className="media-card group relative mt-4 flex min-h-[46vh] items-center justify-center px-6 py-20 text-center"
          style={{ background: 'var(--indigo)' }}
        >
          <span className="relative z-10">
            <span
              className="display block text-white"
              style={{ fontSize: 'clamp(2.2rem, 7.5vw, 7rem)' }}
            >
              {s(landing.band.title)}
            </span>
            <span className="mt-5 block text-sm text-white/80 sm:text-base">
              {s(landing.band.sub)}
            </span>
          </span>
        </Link>
        <div className="mt-4">
          <PlusRow />
        </div>
      </section>

      {/* -------------------------------------------------------- three ways */}
      <section className="edge py-16 sm:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <BigLines lines={[s(landing.ways.kicker)]} className="max-w-[12ch]" />
          <p className="max-w-sm text-sm uppercase leading-[1.5] tracking-[0.04em] text-ink-mute">
            {s(landing.ways.intro)}
          </p>
        </div>

        <div ref={waysRef} className="mt-12 grid gap-6 md:grid-cols-2">
          {ways.map((way) => (
            <Link
              key={way.to}
              to={way.to}
              className="group rounded-media bg-white/55 p-6 transition-transform duration-500 hover:-translate-y-1 sm:p-8"
            >
              <div
                className="mb-6 h-[clamp(160px,22vh,260px)] rounded-[20px]"
                style={{
                  background: `radial-gradient(130% 110% at 20% 10%, ${way.accent} 0%, #0d0d12 72%)`,
                }}
              />
              <p className="text-[0.68rem] uppercase tracking-[0.18em] text-ink-mute">
                {s(way.tags)}
              </p>
              <h3 className="display mt-3" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}>
                {s(way.title)}
              </h3>
              <p className="mt-3 max-w-md text-[0.98rem] leading-[1.5] text-ink-soft">
                {s(way.body)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- evidence */}
      <section className="relative overflow-hidden py-16 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[6%] h-[56%] sm:top-0 sm:h-[64%]"
        >
          <Ribbon
            d="M 1270 180 C 1000 180 1040 520 700 520 C 380 520 330 180 -70 260"
            color="var(--cyan)"
            width={88}
          />
        </div>

        <div className="edge relative z-10">
          <BigLines lines={[s(landing.evidence.line1), s(landing.evidence.line2)]} />

          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <p className="text-[1.02rem] leading-[1.55] text-ink-soft">{s(landing.evidence.body)}</p>

            <ul className="space-y-3">
              {(
                [
                  ['Rule', landing.evidence.badges.rule],
                  ['Service', landing.evidence.badges.service],
                  ['Source', landing.evidence.badges.source],
                  ['AI', landing.evidence.badges.ai],
                ] as const
              ).map(([badge, note]) => (
                <li
                  key={badge}
                  className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] pb-3"
                >
                  <span className="rounded-full bg-ink px-3 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-white">
                    {badge}
                  </span>
                  <span className="text-sm text-ink-soft">{s(note)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- attacker */}
      <section
        data-nav-dark
        className="relative overflow-hidden bg-night py-20 text-white sm:py-32"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[90px]"
          style={{
            background:
              'conic-gradient(from 210deg, rgba(47,59,245,0.55), rgba(70,215,233,0.35), rgba(200,16,46,0.35), rgba(47,59,245,0.55))',
            maskImage: 'radial-gradient(circle, transparent 42%, #000 58%, transparent 76%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 42%, #000 58%, transparent 76%)',
          }}
        />

        <div className="edge relative">
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-white/55">
            {s(landing.attacker.kicker)}
          </p>

          <BigLines lines={[s(landing.attacker.line)]} className="mt-6 max-w-[16ch] text-white" />

          <div className="mt-12 grid gap-10 md:grid-cols-2 md:items-start">
            <p className="max-w-xl text-[1.02rem] leading-[1.55] text-white/70">
              {s(landing.attacker.body)}
            </p>

            <ul ref={factsRef} className="space-y-3">
              {landing.attacker.facts.map((fact, i) => (
                <li
                  key={i}
                  className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-4"
                >
                  <span className="text-xs tabular-nums text-white/40">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[0.98rem]">{s(fact)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12">
            <PillLink to="/protect" tone="ghost" dot>
              {s(landing.ways.protect.title)}
            </PillLink>
          </div>
        </div>

        <div className="mt-16 border-y border-white/10">
          <TacticsMarquee dark />
        </div>

        <div className="edge relative mt-10">
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-white/55">
            {s(landing.tactics.kicker)}
          </p>
          <p className="mt-3 max-w-2xl text-[1.3rem] leading-[1.3] text-white/90 sm:text-[1.8rem]">
            {s(landing.tactics.line)}
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------- CTA */}
      <section className="edge py-20 text-center sm:py-32">
        <p className="text-[0.7rem] uppercase tracking-[0.22em] text-ink-mute">
          {s(landing.cta.kicker)}
        </p>
        <BigLines lines={[s(landing.cta.line)]} className="mx-auto mt-6 max-w-[16ch]" />

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <PillLink to="/check" tone="dark" dot>
            {s(landing.cta.primary)}
          </PillLink>
          <PillLink to="/demo" tone="light">
            {s(landing.cta.secondary)}
          </PillLink>
        </div>
      </section>

      {/* ------------------------------------------------------------ footer */}
      <footer className="edge border-t border-[var(--line)] py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">
              {s(landing.footer.emergency)}
            </h2>
            <ul className="mt-4 space-y-2 text-[1.05rem]">
              <li>
                <a className="underline underline-offset-4" href={HELPLINES.cyberFraud.tel}>
                  {s(landing.footer.call)}
                </a>
              </li>
              <li>
                <a
                  className="underline underline-offset-4"
                  href={HELPLINES.cyberPortal}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {s(landing.footer.report)}
                </a>
              </li>
              <li>
                <a
                  className="underline underline-offset-4"
                  href={HELPLINES.chakshu}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {s(landing.footer.chakshu)}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">
              {s(landing.footer.product)}
            </h2>
            <ul className="mt-4 space-y-2 text-[1.05rem]">
              {ways.map((way) => (
                <li key={way.to}>
                  <Link className="underline underline-offset-4" to={way.to}>
                    {s(way.title)}
                  </Link>
                </li>
              ))}
              <li>
                <Link className="underline underline-offset-4" to="/how-it-works">
                  {s(landing.statement.cta)}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em]">
              {s(landing.footer.promises)}
            </h2>
            <ul className="mt-4 space-y-2 text-[0.98rem] text-ink-soft">
              {landing.footer.promiseList.map((promise, i) => (
                <li key={i}>{s(promise)}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-2xl text-sm text-ink-mute">{s(landing.footer.disclaimer)}</p>
          <button
            type="button"
            onClick={scrollToTop}
            className="grid h-14 w-14 place-items-center rounded-full bg-ink text-white transition-transform duration-500 hover:-translate-y-1"
            aria-label={s(landing.footer.back)}
          >
            <span aria-hidden>↑</span>
          </button>
        </div>
      </footer>

      <div className="bg-night py-6 text-white">
        <TacticsMarquee dark />
      </div>
    </main>
  );
}
