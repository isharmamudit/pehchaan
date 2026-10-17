import { describe, expect, it } from 'vitest';
import { checkLookalike, isOfficial, levenshtein } from '../../supabase/functions/_shared/lookalike.ts';
import { registrableDomain } from '../../supabase/functions/_shared/officialDomains.ts';

describe('levenshtein', () => {
  it('measures edit distance', () => {
    expect(levenshtein('sbi.co.in', 'sbi.co.in')).toBe(0);
    expect(levenshtein('hdfcbank.com', 'hdfcbanl.com')).toBe(1);
    expect(levenshtein('icicibank.com', 'icicbank.com')).toBe(1);
    expect(levenshtein('', 'abc')).toBe(3);
  });
});

describe('registrableDomain', () => {
  it('handles multi-label Indian suffixes', () => {
    expect(registrableDomain('retail.onlinesbi.sbi')).toBe('onlinesbi.sbi');
    expect(registrableDomain('www.sbi.co.in')).toBe('sbi.co.in');
    expect(registrableDomain('a.b.c.gov.in')).toBe('c.gov.in');
    expect(registrableDomain('hdfcbank.com')).toBe('hdfcbank.com');
  });
});

describe('official domains', () => {
  it('accepts official domains and their subdomains', () => {
    expect(isOfficial('sbi.co.in')).toBe(true);
    expect(isOfficial('retail.onlinesbi.sbi')).toBe(true);
    expect(isOfficial('cybercrime.gov.in')).toBe(true);
    expect(checkLookalike('www.hdfcbank.com').flag).toBe(false);
  });
});

describe('lookalike detection', () => {
  it('flags a brand keyword in a non-official domain', () => {
    const r = checkLookalike('kyc-update-sbi.in');
    expect(r.flag).toBe(true);
    expect(r.matchedBrand).toBeTruthy();
  });

  it('flags typosquats within edit distance 2', () => {
    expect(checkLookalike('hdfcbanc.com').flag).toBe(true);
    expect(checkLookalike('phonepe-rewards.xyz').flag).toBe(true);
  });

  it('flags kyc and aadhaar keyword domains', () => {
    expect(checkLookalike('aadhaar-verify.online').flag).toBe(true);
    expect(checkLookalike('kycupdate.in').flag).toBe(true);
  });

  it('leaves unrelated domains alone', () => {
    expect(checkLookalike('swiggy.com').flag).toBe(false);
    expect(checkLookalike('mylocalbakery.in').flag).toBe(false);
    expect(checkLookalike('').flag).toBe(false);
  });
});
