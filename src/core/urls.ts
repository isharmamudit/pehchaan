/**
 * URL extraction that also catches bare domains like `kyc-update.in/x`,
 * which is how most scam SMS in India are written.
 */

export const SHORTENER_HOSTS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'cutt.ly',
  'is.gd',
  'rb.gy',
  'shorturl.at',
  'goo.gl',
  'ow.ly',
  'tiny.cc',
  's.id',
  'rebrand.ly',
  'bitly.com',
  't.ly',
  'shrtco.de',
] as const;

/** TLDs we accept for a bare (scheme-less) domain, to avoid matching "Rs.500" or "etc.so". */
const BARE_TLDS = new Set([
  'com', 'in', 'co', 'net', 'org', 'io', 'xyz', 'info', 'biz', 'online', 'site',
  'top', 'club', 'live', 'app', 'link', 'me', 'ru', 'cn', 'tk', 'ml', 'ga', 'cf',
  'gq', 'shop', 'store', 'icu', 'vip', 'work', 'fun', 'cc', 'ly', 'gl', 'gd', 'id',
  'sbi', 'bank', 'gov', 'edu', 'ac', 'uk', 'us', 'pw', 'buzz', 'rest', 'page', 'dev',
]);

const SCHEME_URL = /\bhttps?:\/\/[^\s<>"'`()\[\]{}]+/gi;
const BARE_DOMAIN =
  /(?<![\w@./-])((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24})(\/[^\s<>"'`()\[\]{}]*)?/gi;

export interface ExtractedUrl {
  /** The raw text as it appears in the message. */
  raw: string;
  /** Normalised, always with a scheme. */
  url: string;
  start: number;
  end: number;
}

function trimTrailingPunctuation(text: string): string {
  return text.replace(/[.,;:!?)\]}'"»”]+$/u, '');
}

export function extractUrls(text: string): ExtractedUrl[] {
  const found: ExtractedUrl[] = [];
  const taken: Array<[number, number]> = [];

  const overlaps = (start: number, end: number) =>
    taken.some(([s, e]) => start < e && end > s);

  for (const m of text.matchAll(SCHEME_URL)) {
    const raw = trimTrailingPunctuation(m[0]);
    const start = m.index ?? 0;
    const end = start + raw.length;
    taken.push([start, end]);
    found.push({ raw, url: raw, start, end });
  }

  for (const m of text.matchAll(BARE_DOMAIN)) {
    const raw = trimTrailingPunctuation(m[0]);
    const start = m.index ?? 0;
    const end = start + raw.length;
    if (overlaps(start, end)) continue;
    const host = (m[1] ?? '').toLowerCase();
    const tld = host.split('.').pop() ?? '';
    if (!BARE_TLDS.has(tld)) continue;
    // A single-label host plus TLD is fine (bit.ly), but reject things like "a.in".
    if (host.length < 4) continue;
    taken.push([start, end]);
    found.push({ raw, url: `http://${raw}`, start, end });
  }

  return found.sort((a, b) => a.start - b.start);
}

/** Character ranges occupied by URLs — the privacy shield must never mask inside these. */
export function urlRanges(text: string): Array<[number, number]> {
  return extractUrls(text).map((u) => [u.start, u.end]);
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function isShortener(url: string): boolean {
  const host = hostOf(url);
  return SHORTENER_HOSTS.some((s) => host === s || host.endsWith(`.${s}`));
}
