/**
 * Pressure profile: which psychological lever this person folds under.
 * Built only from rounds played on this device; nothing leaves it.
 */

import {
  LEVER_LINE,
  LEVER_NAME,
  LEVERS,
  profileSentence,
  resistance,
  weakestLever,
  type PressureProfile as Profile,
} from '../core/levers';
import { useLanguage } from '../lib/language';
import { Card } from './ui';

export default function PressureProfile({
  profile,
  compact = false,
}: {
  profile: Profile;
  compact?: boolean;
}) {
  const { lang, s } = useLanguage();

  const sentence = profileSentence(profile, lang);
  const weakest = weakestLever(profile);
  const played = LEVERS.reduce((sum, lever) => sum + profile[lever].faced, 0);

  if (!played) {
    return compact ? null : (
      <Card>
        <h2 className="text-[1.1rem] font-semibold">
          {s({ en: 'Your pressure profile', hi: 'आपकी दबाव-कुंडली' })}
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          {s({
            en: 'Play a round and this fills in: which lever you resist, and which one you fold under.',
            hi: 'एक राउंड खेलिए और यह भर जाएगा: आप किस दबाव में टिकते हैं, और किसके आगे झुक जाते हैं।',
          })}
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-[1.1rem] font-semibold">
        {s({ en: 'Your pressure profile', hi: 'आपकी दबाव-कुंडली' })}
      </h2>
      {sentence ? <p className="mt-2 text-[1rem] leading-[1.5]">{sentence}</p> : null}

      <ul className="mt-5 space-y-3">
        {LEVERS.map((lever) => {
          const record = profile[lever];
          const score = resistance(record);
          const pct = score === null ? 0 : Math.round(score * 100);
          const isWeak = lever === weakest && record.faced > 0;

          return (
            <li key={lever}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold">
                  {s(LEVER_NAME[lever])}
                  {isWeak ? (
                    <span
                      className="ml-2 rounded-full px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.14em] text-white"
                      style={{ background: 'var(--danger)' }}
                    >
                      {s({ en: 'Weak spot', hi: 'कमज़ोर कड़ी' })}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs tabular-nums text-ink-mute">
                  {record.faced === 0
                    ? s({ en: 'not faced yet', hi: 'अभी सामना नहीं हुआ' })
                    : `${pct}% · ${record.faced} ${
                        record.faced === 1
                          ? s({ en: 'round', hi: 'राउंड' })
                          : s({ en: 'rounds', hi: 'राउंड' })
                      }`}
                </span>
              </div>

              <div
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas-soft"
                role="img"
                aria-label={`${s(LEVER_NAME[lever])}: ${
                  record.faced === 0 ? 'not faced yet' : `${pct}% resisted`
                }`}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{
                    width: `${pct}%`,
                    background: isWeak ? 'var(--danger)' : 'var(--indigo)',
                  }}
                />
              </div>

              {!compact ? (
                <p className="mt-1.5 text-xs leading-[1.45] text-ink-mute">{s(LEVER_LINE[lever])}</p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-5 text-xs text-ink-mute">
        {s({
          en: 'Counted on this device only. "Resisted" means you gave nothing away while that lever was being used.',
          hi: 'सिर्फ़ इसी डिवाइस पर गिना जाता है। "टिके" का मतलब है कि उस दबाव के दौरान आपने कुछ नहीं दिया।',
        })}
      </p>
    </Card>
  );
}
