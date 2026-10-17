import { describe, expect, it } from 'vitest';
import { buildTimeline } from '../core/timeline';
import { runRules } from '../core/rules';

describe('what happens if you reply', () => {
  it('is empty when nothing was found', () => {
    expect(buildTimeline([], 'message')).toEqual([]);
  });

  it('opens with replying and follows the escalation order', () => {
    const text =
      'Your account will be blocked within 24 hours. Please install AnyDesk and share the OTP.';
    const steps = buildTimeline(runRules(text), 'message');

    expect(steps[0]!.tactic).toBe('reply');
    const order = steps.map((s) => s.tactic);
    expect(order.indexOf('threat_fear')).toBeLessThan(order.indexOf('remote_access'));
    expect(order.indexOf('remote_access')).toBeLessThan(order.indexOf('credential_request'));
  });

  it('opens with scanning for a QR input', () => {
    const steps = buildTimeline(runRules('Approve the request to receive your refund'), 'qr');
    expect(steps[0]!.when.en).toMatch(/scan/i);
  });

  it('never repeats a step for a repeated tactic', () => {
    const text = 'Urgent! Act now, today only, last chance, immediately.';
    const steps = buildTimeline(runRules(text), 'message');
    const tactics = steps.map((s) => s.tactic);
    expect(new Set(tactics).size).toBe(tactics.length);
  });
});
