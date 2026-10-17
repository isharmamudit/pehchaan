/**
 * The Check result view. Lives on its own so the guided demo renders the real
 * component with real analysis output, never a mock-up of it.
 */

import { Link } from 'react-router-dom';
import { Card, EvidenceBadge, Notice, VerdictBand } from '../ui';
import { PillButton, PillLink } from '../Pill';
import Highlighted from './Highlighted';
import PrivacyChip from './PrivacyChip';
import ShareCard from './ShareCard';
import { personaForTactic } from '../../core/personas';
import { TACTICS } from '../../core/tactics';
import { explanationFor } from '../../core/explain';
import { CLAIM_LABEL_NOTE, CLAIM_LABELS, needsVerifyCard, verifyCardFor } from '../../core/claims';
import { buildTimeline, TIMELINE_CAVEAT, TIMELINE_NOTE, TIMELINE_TITLE } from '../../core/timeline';
import { hostOf } from '../../core/urls';
import { CACHED_LABEL } from '../../demo/cache';
import { DO_NOW_TITLE, doNowSteps } from '../../config/doNow';
import { useLanguage } from '../../lib/language';
import { t } from '../../i18n';
import type { AnalysisResult } from '../../core/types';

export default function ResultView({
  result,
  counts,
  cached,
  activeId,
  onSelect,
  onReset,
}: {
  result: AnalysisResult;
  counts: string;
  cached: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onReset: () => void;
}) {
  const { lang, s } = useLanguage();
  const strings = t(lang);

  const timeline = buildTimeline(result.findings, result.inputType);
  const spanFindings = result.findings.filter((f) => f.start >= 0);
  const serviceFindings = result.findings.filter((f) => f.start < 0);
  const topTactic = result.findings[0]?.tactic;

  return (
    <div className="space-y-8">
      {cached ? <Notice tone="warn">{s(CACHED_LABEL)}</Notice> : null}

      <VerdictBand verdict={result.verdict} counts={counts} />

      {result.unavailable.length ? (
        <Notice tone="warn">
          {result.unavailable.includes('ai')
            ? strings.check.aiUnavailable
            : strings.check.serviceUnavailable(result.unavailable.join(', '))}
        </Notice>
      ) : null}

      <PrivacyChip counts={result.redactionCounts} />

      <Card>
        <Highlighted
          text={result.text}
          findings={result.findings}
          activeId={activeId}
          onSelect={onSelect}
        />
      </Card>

      {spanFindings.length ? (
        <ol className="grid gap-3 sm:grid-cols-2">
          {spanFindings.map((finding, i) => (
            <li
              key={finding.id}
              className={`rounded-2xl p-4 transition-colors ${
                activeId === finding.id ? 'bg-ink text-white' : 'bg-white/70'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">
                  {i + 1}. {TACTICS[finding.tactic].name[lang]}
                </span>
                <EvidenceBadge evidence={finding.evidence} />
              </div>
              <p className="mt-2 text-sm leading-[1.5] opacity-90">
                {explanationFor(finding, lang)}
              </p>
              {finding.aiExplanation ? (
                <p className="mt-2 text-sm leading-[1.5] opacity-70">{finding.aiExplanation}</p>
              ) : null}
              {finding.hoaxTemplate ? (
                <p className="mt-2 text-xs opacity-70">
                  {s({
                    en: 'This matches a known hoax pattern.',
                    hi: 'यह एक जाने-पहचाने अफ़वाह पैटर्न से मेल खाता है।',
                  })}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      {timeline.length ? (
        <section className="rounded-media bg-night p-6 text-white sm:p-8">
          <h2 className="display" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.4rem)' }}>
            {s(TIMELINE_TITLE)}
          </h2>
          <p className="mt-2 text-xs text-white/50">{s(TIMELINE_CAVEAT)}</p>

          <ol className="mt-6 space-y-0">
            {timeline.map((step, i) => (
              <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                <span className="relative flex flex-col items-center">
                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-full"
                    style={{
                      background:
                        step.tactic === 'credential_request' || step.tactic === 'payment_request'
                          ? 'var(--danger)'
                          : 'var(--cyan)',
                    }}
                  />
                  {i < timeline.length - 1 ? (
                    <span aria-hidden className="mt-1 w-px flex-1 bg-white/20" />
                  ) : null}
                </span>
                <span className="min-w-0 pb-1">
                  <span className="block text-[0.68rem] uppercase tracking-[0.18em] text-white/45">
                    {s(step.when)}
                  </span>
                  <span className="mt-1 block text-[0.98rem] leading-[1.5] text-white/90">
                    {s(step.what)}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-4 border-t border-white/15 pt-4 text-sm text-white/70">
            {s(TIMELINE_NOTE)}
          </p>
        </section>
      ) : null}

      {result.urls.length ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em]">
            {strings.check.links}
          </h2>
          <ul className="space-y-3">
            {result.urls.map((url) => (
              <li key={url.original} className="rounded-2xl bg-white/70 p-4">
                <p className="break-all text-sm font-semibold">{url.original}</p>
                {url.final !== url.original ? (
                  <p className="mt-1 break-all text-sm text-ink-soft">
                    {strings.check.goesTo}: {hostOf(url.final) || url.final}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-canvas-soft px-3 py-1">
                    {url.safeBrowsing === 'match'
                      ? strings.check.blocklistMatch
                      : url.safeBrowsing === 'no_match'
                        ? strings.check.notOnBlocklists
                        : strings.check.blocklistUnavailable}
                  </span>
                  {url.isShortener ? (
                    <span className="rounded-full bg-canvas-soft px-3 py-1">
                      {strings.check.shortened}
                    </span>
                  ) : null}
                  {url.lookalike.flag ? (
                    <span className="rounded-full bg-[#ffe9ec] px-3 py-1 text-[#7a0b1c]">
                      {url.lookalike.reason}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.claims.length ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em]">
            {s({ en: 'Claims in this message', hi: 'इस संदेश के दावे' })}
          </h2>
          <ul className="space-y-3">
            {result.claims.map((claim) => {
              const source = verifyCardFor(claim.topic);
              return (
                <li key={claim.id} className="rounded-2xl bg-white/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{s(CLAIM_LABELS[claim.label])}</span>
                    <EvidenceBadge evidence={claim.evidence} />
                  </div>
                  <p className="mt-2 text-sm leading-[1.5] text-ink-soft">{claim.text}</p>
                  <p className="mt-1 text-xs text-ink-mute">{s(CLAIM_LABEL_NOTE[claim.label])}</p>

                  {claim.matches.map((match) => (
                    <a
                      key={match.url}
                      href={match.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-2 block text-sm underline underline-offset-4"
                    >
                      {match.publisher}: {match.textualRating}
                    </a>
                  ))}

                  {claim.sources?.map((src) => (
                    <a
                      key={src.url}
                      href={src.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-2 block text-sm underline underline-offset-4"
                    >
                      {src.title}
                    </a>
                  ))}

                  {needsVerifyCard(claim.label) ? (
                    <div className="mt-3 rounded-xl bg-canvas-soft p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-ink-mute">
                        {s({ en: 'Verify in 60 seconds', hi: '60 सेकंड में जाँचिए' })}
                      </p>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-1 block text-sm font-semibold underline underline-offset-4"
                      >
                        {s(source.name)}
                      </a>
                      <p className="mt-1 text-sm text-ink-soft">{s(source.what)}</p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {serviceFindings.length ? (
        <ul className="space-y-3">
          {serviceFindings.map((finding) => (
            <li key={finding.id} className="rounded-2xl bg-white/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{TACTICS[finding.tactic].name[lang]}</span>
                <EvidenceBadge evidence={finding.evidence} />
              </div>
              <p className="mt-2 text-sm text-ink-soft">{explanationFor(finding, lang)}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em]">{s(DO_NOW_TITLE)}</h2>
        <ol className="space-y-2">
          {doNowSteps(result.verdict, result.inputType).map((step, i) => (
            <li key={i} className="flex gap-3 rounded-2xl bg-white/70 p-4">
              <span className="text-xs tabular-nums text-ink-mute">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-sm leading-[1.5]">
                {s(step.text)}{' '}
                {step.tel ? (
                  <a className="font-semibold underline underline-offset-4" href={step.tel}>
                    1930
                  </a>
                ) : null}
                {step.href ? (
                  <a
                    className="font-semibold underline underline-offset-4"
                    href={step.href}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    ↗
                  </a>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-2">
        <PillButton tone="dark" dot onClick={onReset}>
          {strings.check.checkAnother}
        </PillButton>

        {topTactic ? (
          <PillLink to={`/practise/${personaForTactic(topTactic)}`} tone="light">
            {strings.check.practiseThis}
          </PillLink>
        ) : null}

        <ShareCard
          verdict={result.verdict}
          redFlagCount={result.findings.length}
          topTactics={result.findings.map((f) => f.tactic)}
          label={strings.check.shareResult}
        />

        <Link
          to="/help"
          className="pill pill-light"
        >
          {strings.app.getHelp}
        </Link>
      </div>
    </div>
  );
}
