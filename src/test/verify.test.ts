import { describe, expect, it } from 'vitest';
import { findQuote, quoteExists, sliceQuote } from '../core/verify';

const INPUT = 'Dear Customer,\nYour account will be  BLOCKED within 24 hrs. Share the OTP now.';

describe('span verification', () => {
  it('finds an exact quote', () => {
    const span = findQuote(INPUT, 'Share the OTP now.');
    expect(span).not.toBeNull();
    expect(INPUT.slice(span!.start, span!.end)).toBe('Share the OTP now.');
  });

  it('ignores case', () => {
    expect(quoteExists(INPUT, 'blocked within 24 hrs')).toBe(true);
  });

  it('ignores whitespace differences, including newlines', () => {
    expect(quoteExists(INPUT, 'account will be BLOCKED')).toBe(true);
    expect(quoteExists(INPUT, 'Dear Customer, Your account')).toBe(true);
  });

  it('returns the original slice, not the AI wording', () => {
    expect(sliceQuote(INPUT, 'blocked  within   24 hrs')).toBe('BLOCKED within 24 hrs');
  });

  it('rejects a quote that is not in the input', () => {
    expect(findQuote(INPUT, 'Click this link to verify')).toBeNull();
    expect(quoteExists(INPUT, 'your card has been charged')).toBe(false);
  });

  it('rejects an empty quote', () => {
    expect(findQuote(INPUT, '   ')).toBeNull();
  });

  it('handles Devanagari', () => {
    const hindi = 'आपका खाता बंद हो जाएगा। तुरंत ओटीपी बताइए।';
    expect(quoteExists(hindi, 'तुरंत ओटीपी बताइए')).toBe(true);
    expect(quoteExists(hindi, 'पैसे भेजिए')).toBe(false);
  });
});
