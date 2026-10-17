/**
 * The guided demo leans on the privacy shield visibly masking the sample
 * message. If the sample ever stops containing maskable values, act two
 * silently becomes a slide that proves nothing — so it is asserted here.
 */

import { describe, expect, it } from 'vitest';
import { DEMO_INPUTS, demoInput } from '../demo/inputs';
import { redact, totalMasked } from '../core/redact';
import { runRules } from '../core/rules';
import { buildTimeline } from '../core/timeline';

describe('guided demo data', () => {
  it('masks several kinds of personal detail in the KYC sample', () => {
    const demo = demoInput('kyc_sms')!;
    const { redacted, counts } = redact(demo.text);

    expect(totalMasked(counts)).toBeGreaterThanOrEqual(3);
    expect(counts.PHONE).toBeGreaterThanOrEqual(1);
    expect(counts.OTP).toBe(1);
    expect(counts.ACCOUNT).toBe(1);

    for (const secret of ['9000000012', '9000000077', '448213', '10020030040']) {
      expect(redacted).not.toContain(secret);
    }
    // The link must survive: it is evidence, not a personal detail.
    expect(redacted).toContain('kyc-update-sbi.in/verify');
  });

  it('still flags the KYC sample as a scam after masking', () => {
    const demo = demoInput('kyc_sms')!;
    const tactics = new Set(runRules(demo.text).map((f) => f.tactic));
    expect(tactics).toContain('threat_fear');
    expect(tactics).toContain('credential_request');
  });

  it('produces a timeline for every text demo', () => {
    for (const demo of DEMO_INPUTS.filter((d) => d.route === '/check')) {
      const steps = buildTimeline(runRules(demo.text), demo.inputType);
      expect(steps.length, demo.id).toBeGreaterThan(1);
    }
  });

  it('keeps the sample photo caption revealing enough to build facts from', () => {
    const demo = demoInput('post_xray_photo')!;
    expect(demo.text).toMatch(/school/i);
    expect(demo.text).toMatch(/till|until/i);
  });
});
