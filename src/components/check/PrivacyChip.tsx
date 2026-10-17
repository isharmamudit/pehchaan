/** "We masked N personal details" — categories only, never values. */

import { useState } from 'react';
import { CATEGORY_LABELS, totalMasked, type RedactionCategory } from '../../core/redact';
import { useLanguage } from '../../lib/language';
import { t } from '../../i18n';

export default function PrivacyChip({
  counts,
}: {
  counts: Partial<Record<RedactionCategory, number>>;
}) {
  const { lang, s } = useLanguage();
  const [open, setOpen] = useState(false);
  const total = totalMasked(counts);
  const strings = t(lang);

  if (total === 0) {
    return <p className="text-xs text-ink-mute">{strings.privacy.nothingMasked}</p>;
  }

  return (
    <div className="rounded-2xl bg-white/70 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-ink-soft">{strings.privacy.masked(total)}</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="text-xs font-semibold uppercase tracking-[0.14em] underline underline-offset-4"
        >
          {strings.privacy.whatWeMasked}
        </button>
      </div>

      {open ? (
        <>
          <ul className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(counts) as RedactionCategory[]).map((key) => (
              <li
                key={key}
                className="rounded-full bg-canvas-soft px-3 py-1 text-xs text-ink-soft"
              >
                {s(CATEGORY_LABELS[key])} × {counts[key]}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-mute">{strings.privacy.categoriesOnly}</p>
        </>
      ) : null}
    </div>
  );
}
