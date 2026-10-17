import { describe, expect, it } from 'vitest';
import { computeVerdict, VERDICT_LABELS, VERDICT_SUBTEXT } from '../core/verdict';
import type { Finding, UrlResult } from '../core/types';

function finding(partial: Partial<Finding>): Finding {
  return {
    id: 'f',
    tactic: 'false_urgency',
    matchedText: 'urgent',
    start: 0,
    end: 6,
    evidence: 'rule',
    explanation: '',
    weight: 1,
    ...partial,
  };
}

function url(partial: Partial<UrlResult>): UrlResult {
  return {
    original: 'http://a.in',
    final: 'http://a.in',
    hops: 0,
    isShortener: false,
    lookalike: { flag: false },
    safeBrowsing: 'no_match',
    ...partial,
  };
}

describe('verdict', () => {
  it('is no_red_flags when nothing was found', () => {
    expect(computeVerdict({ findings: [], urls: [] }).verdict).toBe('no_red_flags');
  });

  it('is suspicious for a single low-weight finding', () => {
    const { verdict } = computeVerdict({ findings: [finding({ weight: 1 })], urls: [] });
    expect(verdict).toBe('suspicious');
  });

  it('is likely_scam on any credential request', () => {
    const { verdict } = computeVerdict({
      findings: [finding({ tactic: 'credential_request', weight: 3 })],
      urls: [],
    });
    expect(verdict).toBe('likely_scam');
  });

  it('is likely_scam on any remote access finding', () => {
    const { verdict } = computeVerdict({
      findings: [finding({ tactic: 'remote_access', weight: 1 })],
      urls: [],
    });
    expect(verdict).toBe('likely_scam');
  });

  it('is likely_scam on a Safe Browsing match even with no other finding', () => {
    const { verdict } = computeVerdict({ findings: [], urls: [url({ safeBrowsing: 'match' })] });
    expect(verdict).toBe('likely_scam');
  });

  it('is likely_scam for a upi pay QR', () => {
    expect(computeVerdict({ findings: [], urls: [], upiPayQr: true }).verdict).toBe('likely_scam');
  });

  it('is likely_scam once the weighted score reaches 5', () => {
    const findings = [finding({ weight: 2 }), finding({ id: 'g', weight: 3 })];
    const { verdict, score } = computeVerdict({ findings, urls: [] });
    expect(score).toBe(5);
    expect(verdict).toBe('likely_scam');
  });

  it('stays suspicious at a score of 4', () => {
    const findings = [finding({ weight: 2 }), finding({ id: 'g', weight: 2 })];
    expect(computeVerdict({ findings, urls: [] }).verdict).toBe('suspicious');
  });

  it('ignores an unavailable blocklist', () => {
    const { verdict } = computeVerdict({ findings: [], urls: [url({ safeBrowsing: 'unavailable' })] });
    expect(verdict).toBe('no_red_flags');
  });
});

describe('copy never says safe', () => {
  const allCopy = [
    ...Object.values(VERDICT_LABELS).flatMap((v) => [v.en, v.hi]),
    ...Object.values(VERDICT_SUBTEXT).flatMap((v) => [v.en, v.hi]),
  ];

  it('contains no claim of safety', () => {
    for (const line of allCopy) {
      expect(line.toLowerCase()).not.toMatch(/\bsafe\b|\bsecure\b|\bgenuine\b|सुरक्षित है/);
    }
  });
});
