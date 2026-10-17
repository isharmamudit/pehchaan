import { describe, expect, it } from 'vitest';
import { labelClaim, labelFromRating, needsVerifyCard, verifyCardFor } from '../core/claims';
import type { FactCheckMatch } from '../core/types';

const match = (rating: string): FactCheckMatch => ({
  publisher: 'Example Fact Check',
  title: 'A claim',
  url: 'https://example.org/a',
  textualRating: rating,
});

describe('labelFromRating', () => {
  it('maps false ratings', () => {
    for (const r of ['False', 'Fake', 'Misleading', 'Hoax', 'Baseless', 'Incorrect']) {
      expect(labelFromRating(r)).toBe('fact_checked_false');
    }
  });

  it('maps accurate ratings', () => {
    for (const r of ['True', 'Correct', 'Accurate']) {
      expect(labelFromRating(r)).toBe('fact_checked_accurate');
    }
  });

  it('treats partly true as disputed, not accurate', () => {
    expect(labelFromRating('Partly true')).toBe('disputed');
    expect(labelFromRating('Half true')).toBe('disputed');
    expect(labelFromRating('Needs context')).toBe('disputed');
    expect(labelFromRating('Unproven')).toBe('disputed');
  });

  it('returns null for an unknown or empty rating', () => {
    expect(labelFromRating('Flip flop')).toBeNull();
    expect(labelFromRating('')).toBeNull();
    expect(labelFromRating(undefined)).toBeNull();
  });
});

describe('labelClaim', () => {
  it('labels an opinion', () => {
    expect(labelClaim('opinion', []).label).toBe('opinion');
  });

  it('labels an unmatched claim as not verified', () => {
    const r = labelClaim('checkable', []);
    expect(r.label).toBe('not_verified');
    expect(r.evidence).toBe('ai');
  });

  it('uses the source badge when a publisher rated it', () => {
    const r = labelClaim('checkable', [match('False')]);
    expect(r.label).toBe('fact_checked_false');
    expect(r.evidence).toBe('source');
  });

  it('prefers false over accurate when publishers disagree', () => {
    expect(labelClaim('checkable', [match('True'), match('False')]).label).toBe(
      'fact_checked_false',
    );
  });

  it('falls back to not_verified when ratings are unrecognised', () => {
    expect(labelClaim('checkable', [match('Scorecard')]).label).toBe('not_verified');
  });
});

describe('verify cards', () => {
  it('shows a card for unverified and disputed claims only', () => {
    expect(needsVerifyCard('not_verified')).toBe(true);
    expect(needsVerifyCard('disputed')).toBe(true);
    expect(needsVerifyCard('fact_checked_false')).toBe(false);
    expect(needsVerifyCard('opinion')).toBe(false);
  });

  it('routes each topic to its official source', () => {
    expect(verifyCardFor('banking_currency').name.en).toMatch(/Reserve Bank/);
    expect(verifyCardFor('government_scheme').name.en).toMatch(/PIB/);
    expect(verifyCardFor('elections').name.en).toMatch(/Election Commission/);
    expect(verifyCardFor('health').name.en).toMatch(/Health/);
    expect(verifyCardFor('other').url).toMatch(/^https:/);
  });
});
