/**
 * Side by side: what the user typed, and the exact payload that goes to the
 * server. The payload is built by the same function the pipeline uses, so this
 * is a demonstration rather than an illustration — if the shield ever stopped
 * masking something, this panel would show it.
 */

import { useMemo } from 'react';
import { buildAnalyzeRequest } from '../../core/pipeline';
import { redact, CATEGORY_LABELS, totalMasked, type RedactionCategory } from '../../core/redact';
import { runRules } from '../../core/rules';
import { useLanguage } from '../../lib/language';
import type { InputType } from '../../core/types';

/** Highlight every [TOKEN_n] so the masking is visible at a glance. */
function TokenText({ text }: { text: string }) {
  const parts = text.split(/(\[[A-Z]+_\d+\])/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\[[A-Z]+_\d+\]$/.test(part) ? (
          <span
            key={i}
            className="rounded px-1 py-0.5 font-semibold"
            style={{ background: 'rgba(70, 215, 233, 0.22)', color: 'var(--cyan)' }}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function WhatLeftDevice({
  text,
  inputType = 'message',
}: {
  text: string;
  inputType?: InputType;
}) {
  const { lang, s } = useLanguage();

  const { payload, counts, json } = useMemo(() => {
    const { redacted, counts: c } = redact(text);
    const request = buildAnalyzeRequest(redacted, lang, inputType, runRules(text, { lang }));
    return { payload: request, counts: c, json: JSON.stringify(request, null, 2) };
  }, [text, lang, inputType]);

  const masked = totalMasked(counts);
  const categories = Object.keys(counts) as RedactionCategory[];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-media bg-white/70 p-5">
        <h3 className="text-[0.68rem] uppercase tracking-[0.2em] text-ink-mute">
          {s({ en: 'On your device', hi: 'आपके डिवाइस पर' })}
        </h3>
        <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-[0.8rem] leading-[1.6] text-ink">
          {text}
        </pre>
      </section>

      <section className="rounded-media bg-night p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[0.68rem] uppercase tracking-[0.2em] text-white/50">
            {s({ en: 'Sent to the server', hi: 'सर्वर को भेजा गया' })}
          </h3>
          <span
            className="rounded-full px-3 py-1 text-[0.6rem] uppercase tracking-[0.14em]"
            style={{ background: 'rgba(70,215,233,0.15)', color: 'var(--cyan)' }}
          >
            {masked}{' '}
            {masked === 1
              ? s({ en: 'detail masked', hi: 'जानकारी छिपाई' })
              : s({ en: 'details masked', hi: 'जानकारियाँ छिपाईं' })}
          </span>
        </div>

        <pre className="mt-3 max-h-[42vh] overflow-auto whitespace-pre-wrap break-words font-mono text-[0.76rem] leading-[1.6] text-white/85">
          <TokenText text={json} />
        </pre>

        {categories.length ? (
          <ul className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            {categories.map((key) => (
              <li
                key={key}
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70"
              >
                {s(CATEGORY_LABELS[key])} × {counts[key]}
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-4 text-xs leading-[1.5] text-white/45">
          {s({
            en: 'The rule findings travel too, with their matched text masked the same way. Nothing is stored at the other end.',
            hi: 'नियमों से मिले नतीजे भी जाते हैं, उनका मिला हुआ वाक्य भी इसी तरह छिपाकर। दूसरी तरफ़ कुछ भी सेव नहीं होता।',
          })}
        </p>
      </section>

      <p className="text-sm text-ink-soft lg:col-span-2">
        {s({
          en: 'Rules ran on the original text before masking, so hiding these values costs no evidence — the flags you just saw were all found on the device.',
          hi: 'नियम छिपाने से पहले असली टेक्स्ट पर चल चुके थे, इसलिए इन्हें छिपाने से कोई सबूत नहीं जाता — अभी दिखे सारे संकेत डिवाइस पर ही मिले थे।',
        })}
      </p>

      <p className="sr-only">
        {payload.ruleFindings.length} rule findings included in the request.
      </p>
    </div>
  );
}
