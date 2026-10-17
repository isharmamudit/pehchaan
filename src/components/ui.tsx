/** Shared product UI, in the same language as the landing page. */

import type { ReactNode } from 'react';
import { useLanguage } from '../lib/language';
import type { Evidence, Verdict } from '../core/types';
import type { Localised } from '../core/tactics';
import { VERDICT_LABELS, VERDICT_SUBTEXT } from '../core/verdict';

export function Page({ children }: { children: ReactNode }) {
  return (
    <main
      id="main"
      className="edge w-full max-w-full overflow-x-hidden pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pt-32 sm:pb-24"
    >
      {children}
    </main>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.7rem] uppercase tracking-[0.22em] text-ink-mute">{children}</p>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="mb-6 sm:mb-10 w-full max-w-full overflow-hidden break-words">
      <h1 className="display text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl break-words" style={{ fontSize: 'clamp(2rem, 6.5vw, 4.5rem)' }}>
        {children}
      </h1>
      {sub ? <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-ink-mute sm:mt-4 sm:text-[1.02rem] break-words">{sub}</p> : null}
    </header>
  );
}

export function Card({
  children,
  className = '',
  tone = 'light',
}: {
  children: ReactNode;
  className?: string;
  tone?: 'light' | 'dark';
}) {
  const base =
    tone === 'dark'
      ? 'bg-night text-white shadow-md border border-white/10'
      : 'bg-white/95 text-ink border border-line/15 shadow-[0_2px_12px_rgba(0,0,0,0.04)]';
  return <section className={`rounded-card sm:rounded-media p-4 sm:p-7 w-full max-w-full overflow-hidden break-words [overflow-wrap:anywhere] ${base} ${className}`}>{children}</section>;
}

/* ------------------------------------------------------------- evidence */

const EVIDENCE_LABEL: Record<Evidence, Localised> = {
  rule: { en: 'Rule', hi: 'नियम' },
  service: { en: 'Service', hi: 'सेवा' },
  source: { en: 'Source', hi: 'स्रोत' },
  ai: { en: 'AI', hi: 'एआई' },
};

export const EVIDENCE_HELP: Record<Evidence, Localised> = {
  rule: {
    en: 'Matched a pattern checked in your browser.',
    hi: 'आपके ब्राउज़र में जाँचे गए पैटर्न से मिला।',
  },
  service: {
    en: 'Checked against an external service such as Google Safe Browsing.',
    hi: 'गूगल सेफ़ ब्राउज़िंग जैसी बाहरी सेवा से जाँचा गया।',
  },
  source: {
    en: 'Backed by a published fact-check with a link.',
    hi: 'प्रकाशित फ़ैक्ट-चेक और उसके लिंक पर आधारित।',
  },
  ai: {
    en: 'Explained by AI, quoting text we verified is in your message.',
    hi: 'एआई ने समझाया; उद्धृत वाक्य आपके संदेश में है, हमने जाँचा।',
  },
};

const EVIDENCE_STYLE: Record<Evidence, string> = {
  rule: 'bg-ink text-white',
  service: 'bg-indigo text-white',
  source: 'bg-calm text-white',
  ai: 'border border-ink/30 text-ink',
};

export function EvidenceBadge({ evidence }: { evidence: Evidence }) {
  const { s } = useLanguage();
  return (
    <span
      title={s(EVIDENCE_HELP[evidence])}
      className={`inline-flex rounded-full px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] ${EVIDENCE_STYLE[evidence]}`}
    >
      {s(EVIDENCE_LABEL[evidence])}
    </span>
  );
}

/* -------------------------------------------------------------- verdict */

const VERDICT_BG: Record<Verdict, string> = {
  likely_scam: 'var(--danger)',
  suspicious: 'var(--warn)',
  no_red_flags: 'var(--calm)',
};

export function VerdictBand({
  verdict,
  counts,
}: {
  verdict: Verdict;
  counts: string;
}) {
  const { s } = useLanguage();
  return (
    <div
      className="rounded-media px-6 py-7 text-white"
      style={{ background: VERDICT_BG[verdict] }}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="display" style={{ fontSize: 'clamp(1.9rem, 5.5vw, 3.4rem)' }}>
          {s(VERDICT_LABELS[verdict])}
        </h2>
        <span className="text-sm text-white/85">{counts}</span>
      </div>
      <p className="mt-3 max-w-3xl text-[0.98rem] leading-[1.5] text-white/90">
        {s(VERDICT_SUBTEXT[verdict])}
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- states */

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-ink-soft" role="status" aria-live="polite">
      <span
        aria-hidden
        className="h-4 w-4 animate-spin rounded-full border-2 border-ink/25 border-t-ink"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn' | 'error';
  children: ReactNode;
}) {
  const styles = {
    info: 'bg-white/70 text-ink-soft',
    warn: 'bg-[#fff4e0] text-[#6b4300]',
    error: 'bg-[#ffe9ec] text-[#7a0b1c]',
  } as const;
  return (
    <div className={`rounded-2xl px-4 py-3 text-sm ${styles[tone]}`} role="status">
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.72rem] uppercase tracking-[0.18em] text-ink-mute">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-xs text-ink-mute">{hint}</span> : null}
    </label>
  );
}

export function Chip({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const cls = active ? 'bg-ink text-white' : 'bg-white/70 text-ink-soft hover:bg-white';
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[40px] shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${cls}`}
    >
      {children}
    </button>
  ) : (
    <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm ${cls}`}>{children}</span>
  );
}
