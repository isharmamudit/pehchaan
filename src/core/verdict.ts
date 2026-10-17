/**
 * Verdict is computed in code. The AI's opinion is ignored on purpose.
 * There is no "safe" verdict — a clean result still says "verify yourself".
 */

import type { Finding, UrlResult, Verdict } from './types';

export const HIGH_RISK_TACTICS = ['credential_request', 'remote_access'] as const;

export interface VerdictInput {
  findings: Finding[];
  urls: UrlResult[];
  /** Set when a decoded QR is a upi://pay request (money leaves the user). */
  upiPayQr?: boolean;
}

export function weightedScore(findings: Finding[]): number {
  return findings.reduce((sum, f) => sum + (f.weight || 1), 0);
}

export function computeVerdict(input: VerdictInput): { verdict: Verdict; score: number } {
  const { findings, urls, upiPayQr } = input;
  const score = weightedScore(findings);

  const safeBrowsingHit = urls.some((u) => u.safeBrowsing === 'match');
  const highRisk = findings.some((f) =>
    (HIGH_RISK_TACTICS as readonly string[]).includes(f.tactic),
  );

  if (safeBrowsingHit || highRisk || upiPayQr || score >= 5) {
    return { verdict: 'likely_scam', score };
  }
  if (findings.length > 0 || score >= 2) {
    return { verdict: 'suspicious', score };
  }
  return { verdict: 'no_red_flags', score };
}

export const VERDICT_LABELS: Record<Verdict, { en: string; hi: string }> = {
  likely_scam: { en: 'Likely scam', hi: 'संभावित ठगी' },
  suspicious: { en: 'Suspicious', hi: 'संदिग्ध' },
  no_red_flags: { en: 'No red flags found', hi: 'कोई चेतावनी संकेत नहीं मिला' },
};

/** Never the word "safe". Checked by a test. */
export const VERDICT_SUBTEXT: Record<Verdict, { en: string; hi: string }> = {
  likely_scam: {
    en: 'Do not reply, do not click, do not pay. Verify through an official channel yourself.',
    hi: 'जवाब न दें, लिंक न खोलें, पैसे न भेजें। आधिकारिक माध्यम से ख़ुद जाँच करें।',
  },
  suspicious: {
    en: 'Some warning signs are present. Verify through an official channel before acting.',
    hi: 'कुछ चेतावनी संकेत मिले हैं। कुछ भी करने से पहले आधिकारिक माध्यम से जाँच करें।',
  },
  no_red_flags: {
    en: 'We did not find known warning signs. If money or personal details are involved, verify through the official website or helpline yourself.',
    hi: 'हमें कोई जाना-पहचाना चेतावनी संकेत नहीं मिला। अगर पैसे या निजी जानकारी शामिल है, तो आधिकारिक वेबसाइट या हेल्पलाइन से ख़ुद जाँच करें।',
  },
};
