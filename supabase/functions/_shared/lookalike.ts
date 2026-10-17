/**
 * Lookalike-domain detection. Pure functions, no Deno APIs,
 * so the Vitest suite can test them directly.
 */

import {
  BRAND_KEYWORDS,
  OFFICIAL_DOMAINS,
  registrableDomain,
} from './officialDomains.ts';

export interface LookalikeResult {
  flag: boolean;
  matchedBrand?: string;
  reason?: string;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1]! + 1, prev[j]! + 1, prev[j - 1]! + cost);
    }
    prev = curr;
  }
  return prev[b.length]!;
}

/** True when the host is an official domain or a subdomain of one. */
export function isOfficial(hostname: string, official: string[] = OFFICIAL_DOMAINS): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return official.some((d) => host === d || host.endsWith(`.${d}`));
}

export function checkLookalike(
  hostname: string,
  official: string[] = OFFICIAL_DOMAINS,
): LookalikeResult {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  if (!host) return { flag: false };
  if (isOfficial(host, official)) return { flag: false };

  // 1. A brand or scheme keyword inside a domain that is not the official one.
  const hostNoDots = host.replace(/[.-]/g, '');
  for (const { keyword, brand } of BRAND_KEYWORDS) {
    const bare = keyword.replace(/-/g, '');
    if (host.includes(keyword) || hostNoDots.includes(bare)) {
      return {
        flag: true,
        matchedBrand: brand,
        reason: `The address contains "${keyword}" but is not an official ${brand} domain.`,
      };
    }
  }

  // 2. A near-miss spelling of an official registrable domain.
  const registrable = registrableDomain(host);
  for (const d of official) {
    const distance = levenshtein(registrable, d);
    if (distance > 0 && distance <= 2) {
      return {
        flag: true,
        matchedBrand: d,
        reason: `"${registrable}" is only ${distance} character${distance === 1 ? '' : 's'} away from the official "${d}".`,
      };
    }
  }

  return { flag: false };
}
