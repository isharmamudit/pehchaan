/**
 * Nothing leaves the browser unredacted. These tests assert that on the exact
 * payloads the app builds, not on the intention.
 */

import { describe, expect, it } from 'vitest';
import { buildAnalyzeRequest } from '../core/pipeline';
import { shieldHistory } from '../lib/practise';
import { redact } from '../core/redact';
import { runRules } from '../core/rules';

const SECRETS = [
  '9876543210',
  'ramesh.kumar@example.com',
  '2345 6789 0123',
  'ABCDE1234F',
  '4539 1488 0343 6467',
  '448213',
  'winner.payout@okaxis',
];

const MESSAGE = `Dear Ramesh, account blocked. Call 9876543210 or mail ramesh.kumar@example.com.
Aadhaar 2345 6789 0123, PAN ABCDE1234F, card 4539 1488 0343 6467.
Share the OTP 448213 and pay to winner.payout@okaxis today.`;

describe('the analyze payload', () => {
  const { redacted } = redact(MESSAGE);
  const payload = buildAnalyzeRequest(redacted, 'en', 'message', runRules(MESSAGE));
  const serialised = JSON.stringify(payload);

  it('contains no raw personal detail anywhere', () => {
    for (const secret of SECRETS) {
      expect(serialised).not.toContain(secret);
      expect(serialised).not.toContain(secret.replace(/ /g, ''));
    }
  });

  it('still carries the rule findings so the AI has context', () => {
    expect(payload.ruleFindings.length).toBeGreaterThan(0);
    expect(payload.ruleFindings.every((r) => typeof r.tactic === 'string')).toBe(true);
  });

  it('keeps the masking tokens intact', () => {
    expect(payload.text).toMatch(/\[PHONE_\d+\]/);
    expect(payload.text).toMatch(/\[EMAIL_\d+\]/);
  });
});

describe('the sparring payload', () => {
  it('redacts the user turns and leaves the scammer lines alone', () => {
    const shielded = shieldHistory([
      { role: 'scammer', text: 'Call this number to verify: 9876543210' },
      { role: 'user', text: 'My Aadhaar is 2345 6789 0123 and OTP 448213' },
    ]);

    expect(shielded[0]!.text).toContain('9876543210'); // our own simulated line
    expect(shielded[1]!.text).not.toContain('2345 6789 0123');
    expect(shielded[1]!.text).not.toContain('448213');
    expect(shielded[1]!.text).toMatch(/\[AADHAAR_\d+\]/);
  });
});
