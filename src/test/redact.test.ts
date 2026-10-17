import { describe, expect, it } from 'vitest';
import { luhn, redact, restore, totalMasked } from '../core/redact';
import redactionFixtures from './fixtures/redaction.json';

interface RedactionFixture {
  id: string;
  input: string;
  mustMask: string[];
  mustKeep: string[];
}

describe('luhn', () => {
  it('accepts valid card numbers', () => {
    expect(luhn('4539148803436467')).toBe(true);
    expect(luhn('4539 1488 0343 6467')).toBe(true);
    expect(luhn('6011111111111117')).toBe(true);
  });

  it('rejects invalid or wrong-length numbers', () => {
    expect(luhn('4539148803436468')).toBe(false);
    expect(luhn('1234567890123')).toBe(false);
    expect(luhn('9876543210')).toBe(false); // 10 digits, not a card
    expect(luhn('')).toBe(false);
  });
});

describe('redact: positives', () => {
  const cases: Array<[string, string, string]> = [
    ['plain mobile', 'Call me on 9876543210 today', 'PHONE'],
    ['mobile with +91', 'My number is +91 98765 43210', 'PHONE'],
    ['mobile with 0 prefix', 'Dial 09876543210 now', 'PHONE'],
    ['mobile with dashes', 'Ring 98765-43210 please', 'PHONE'],
    ['email', 'Mail ramesh.kumar@example.com', 'EMAIL'],
    ['aadhaar grouped', 'Aadhaar 2345 6789 0123 pending', 'AADHAAR'],
    ['aadhaar plain', 'Aadhaar 234567890123 pending', 'AADHAAR'],
    ['pan', 'PAN ABCDE1234F linked', 'PAN'],
    ['card', 'Card 4539 1488 0343 6467 expiring', 'CARD'],
    ['account number', 'Credit to 123456789012345 immediately', 'ACCOUNT'],
    ['upi id', 'Pay to winner.payout@okaxis now', 'UPI'],
    ['otp near keyword', 'Share the OTP 448213 with us', 'OTP'],
    ['otp hindi keyword', 'ओटीपी 448213 बताइए', 'OTP'],
  ];

  for (const [name, input, category] of cases) {
    it(`masks ${name}`, () => {
      const { redacted, counts } = redact(input);
      expect(redacted).toMatch(new RegExp(`\\[${category}_\\d+\\]`));
      expect(counts[category as keyof typeof counts]).toBeGreaterThan(0);
    });
  }
});

describe('redact: negatives', () => {
  it('never masks inside a URL', () => {
    const input = 'Open kyc-update-sbi.in/verify?id=9876543210 now';
    const { redacted } = redact(input);
    expect(redacted).toContain('kyc-update-sbi.in/verify?id=9876543210');
  });

  it('does not mask ordinary amounts or dates', () => {
    const { redacted, counts } = redact('Your bill of Rs 1340 is due on 20th');
    expect(redacted).toContain('1340');
    expect(totalMasked(counts)).toBe(0);
  });

  it('does not mask a landline-looking 8 digit number without context', () => {
    const { counts } = redact('Reference 12345678 noted');
    expect(totalMasked(counts)).toBe(0);
  });

  it('does not treat an email as a UPI id as well', () => {
    const { counts } = redact('Write to a.b@example.com');
    expect(counts.EMAIL).toBe(1);
    expect(counts.UPI ?? 0).toBe(0);
  });

  it('does not mask a 4 digit number far from any OTP word', () => {
    const text = `OTP sent. ${'x'.repeat(60)} Reference 4412 for your records`;
    const { counts } = redact(text);
    expect(counts.OTP ?? 0).toBe(0);
  });
});

describe('redact: tokens and mapping', () => {
  it('reuses one token for the same value', () => {
    const { redacted, counts } = redact('Call 9876543210 or 9876543210 again');
    expect(counts.PHONE).toBe(1);
    expect(redacted.match(/\[PHONE_1\]/g)?.length).toBe(2);
  });

  it('restores the original text from the map', () => {
    const input = 'Call 9876543210 and mail a@b.com';
    const { redacted, map } = redact(input);
    expect(restore(redacted, map)).toBe(input);
  });

  it('keeps surrounding text untouched', () => {
    const { redacted } = redact('Pay now 9876543210 urgently');
    expect(redacted.startsWith('Pay now ')).toBe(true);
    expect(redacted.endsWith(' urgently')).toBe(true);
  });
});

describe('redaction fixtures', () => {
  for (const fixture of redactionFixtures as RedactionFixture[]) {
    it(fixture.id, () => {
      const { redacted } = redact(fixture.input);
      for (const value of fixture.mustMask) expect(redacted).not.toContain(value);
      for (const value of fixture.mustKeep) expect(redacted).toContain(value);
    });
  }
});
