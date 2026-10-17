import { describe, expect, it } from 'vitest';
import { analyzeInput, mergeFindings, verifyAiFindings } from '../core/pipeline';
import { redact } from '../core/redact';
import { runRules } from '../core/rules';
import { isFlagged, MESSAGE_FIXTURES, runRedactionChecks } from '../core/lab';
import type { Finding } from '../core/types';

describe('AI findings are verified against the input', () => {
  const input = 'Your account will be blocked within 24 hours. Share the OTP now.';

  it('keeps a finding whose text is really in the input', () => {
    const out = verifyAiFindings(
      input,
      [{ text: 'Share the OTP now', tactic: 'credential_request', explanation: 'They want your code.' }],
      {},
    );
    expect(out).toHaveLength(1);
    expect(input.slice(out[0]!.start, out[0]!.end)).toBe('Share the OTP now');
    expect(out[0]!.evidence).toBe('ai');
  });

  it('drops a finding the AI invented', () => {
    const out = verifyAiFindings(
      input,
      [{ text: 'Click this link to verify', tactic: 'suspicious_link', explanation: 'Invented.' }],
      {},
    );
    expect(out).toHaveLength(0);
  });

  it('drops a finding with an unknown tactic', () => {
    const out = verifyAiFindings(
      input,
      [{ text: 'Share the OTP now', tactic: 'mind_control' as never, explanation: '' }],
      {},
    );
    expect(out).toHaveLength(0);
  });

  it('maps tokens back before checking the quote', () => {
    const original = 'Call 9876543210 right now';
    const { map } = redact(original);
    const out = verifyAiFindings(
      original,
      [{ text: 'Call [PHONE_1] right now', tactic: 'false_urgency', explanation: 'Pressure.' }],
      map,
    );
    expect(out).toHaveLength(1);
    expect(out[0]!.matchedText).toBe('Call 9876543210 right now');
  });
});

describe('merging rule and AI findings', () => {
  const base: Finding = {
    id: 'r1',
    tactic: 'false_urgency',
    matchedText: 'within 24 hours',
    start: 10,
    end: 25,
    evidence: 'rule',
    explanation: 'Rule wording.',
    weight: 2,
  };

  it('keeps the rule finding and attaches the AI sentence on overlap', () => {
    const merged = mergeFindings(
      [structuredClone(base)],
      [{ ...base, id: 'a1', evidence: 'ai', explanation: 'AI wording.', weight: 1 }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]!.evidence).toBe('rule');
    expect(merged[0]!.aiExplanation).toBe('AI wording.');
  });

  it('keeps a non-overlapping AI finding', () => {
    const merged = mergeFindings(
      [structuredClone(base)],
      [{ ...base, id: 'a1', start: 40, end: 50, tactic: 'payment_request', evidence: 'ai', weight: 1 }],
    );
    expect(merged).toHaveLength(2);
  });

  it('sorts service findings (no span) last', () => {
    const service: Finding = {
      ...base,
      id: 's1',
      start: -1,
      end: -1,
      evidence: 'service',
      tactic: 'suspicious_link',
    };
    const merged = mergeFindings([service, structuredClone(base)], []);
    expect(merged[merged.length - 1]!.evidence).toBe('service');
  });
});

describe('offline pipeline', () => {
  it('produces a verdict with no network at all', async () => {
    const result = await analyzeInput({
      text: 'Your account will be blocked within 24 hours. Please share the OTP immediately.',
      inputType: 'message',
      lang: 'en',
      offline: true,
    });
    expect(result.verdict).toBe('likely_scam');
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings.every((f) => f.evidence === 'rule')).toBe(true);
    expect(result.unavailable).toHaveLength(0);
  });

  it('reports no red flags for an ordinary message', async () => {
    const result = await analyzeInput({
      text: 'Society meeting on Sunday at 10 AM in the community hall.',
      inputType: 'message',
      lang: 'en',
      offline: true,
    });
    expect(result.verdict).toBe('no_red_flags');
  });

  it('counts masked details without sending them', async () => {
    const result = await analyzeInput({
      text: 'Call me on 9876543210 and share the OTP 448213',
      inputType: 'message',
      lang: 'en',
      offline: true,
    });
    expect(result.redactionCounts.PHONE).toBe(1);
    expect(result.redactionCounts.OTP).toBe(1);
  });
});

describe('fixtures: rules alone must carry the demo', () => {
  it('flags every scam fixture with rules only', async () => {
    const scams = MESSAGE_FIXTURES.filter((f) => f.expected === 'scam');
    const missed: string[] = [];
    for (const fixture of scams) {
      const result = await analyzeInput({
        text: fixture.text,
        inputType: 'message',
        lang: 'en',
        offline: true,
      });
      if (!isFlagged(result.verdict)) missed.push(fixture.id);
    }
    expect(missed).toEqual([]);
  });

  it('does not flag the legitimate fixtures', async () => {
    const legit = MESSAGE_FIXTURES.filter((f) => f.expected === 'legit');
    const wrong: string[] = [];
    for (const fixture of legit) {
      const result = await analyzeInput({
        text: fixture.text,
        inputType: 'message',
        lang: 'en',
        offline: true,
      });
      if (isFlagged(result.verdict)) wrong.push(`${fixture.id}:${result.verdict}`);
    }
    expect(wrong).toEqual([]);
  });

  it('passes every redaction fixture', () => {
    const { passed, total, failures } = runRedactionChecks();
    expect(failures).toEqual([]);
    expect(passed).toBe(total);
  });
});

describe('rule findings sent to the AI are redacted', () => {
  it('masks the matched text of a rule finding', () => {
    const text = 'Share the OTP 448213 now';
    const findings = runRules(text);
    for (const f of findings) {
      expect(redact(f.matchedText).redacted).not.toContain('448213');
    }
  });
});
