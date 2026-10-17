/**
 * Privacy shield. Runs in the browser before ANY network call.
 * The rule engine runs on the original text first, so masking loses no evidence.
 */

import { urlRanges } from './urls';

export type RedactionCategory =
  | 'PHONE'
  | 'EMAIL'
  | 'AADHAAR'
  | 'PAN'
  | 'CARD'
  | 'ACCOUNT'
  | 'UPI'
  | 'OTP';

export interface RedactionResult {
  redacted: string;
  /** token -> original value. Memory only, never sent anywhere. */
  map: Record<string, string>;
  counts: Partial<Record<RedactionCategory, number>>;
}

interface Candidate {
  start: number;
  end: number;
  value: string;
  category: RedactionCategory;
}

/** Luhn check for card-like digit runs. */
export function luhn(digits: string): boolean {
  const clean = digits.replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let d = clean.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

const EMAIL_RE = /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g;
const UPI_RE = /\b[\w.\-]{2,}@[a-zA-Z]{2,}\b/g;
const PAN_RE = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g;

/**
 * Digit runs are written with spaces and dashes in real messages, so a
 * boundary must reject an adjacent digit group too: "4539 1488 0343" inside
 * a card number must not be read as an Aadhaar number.
 */
const LEFT = '(?<!\\d)(?<!\\d[ -])';
const RIGHT = '(?!\\d)(?![ -]\\d)';

const AADHAAR_RE = new RegExp(`${LEFT}\\d{4}[ -]?\\d{4}[ -]?\\d{4}${RIGHT}`, 'g');
const CARDLIKE_RE = new RegExp(`${LEFT}(?:\\d[ -]?){12,18}\\d${RIGHT}`, 'g');
const PHONE_RE = new RegExp(
  `${LEFT}(?:(?:\\+?91|0)[ -]?)?[6-9](?:[ -]?\\d){9}${RIGHT}`,
  'g',
);
const ACCOUNT_RE = new RegExp(`${LEFT}\\d{9,18}${RIGHT}`, 'g');
const OTP_KEYWORD =
  /(?:\botp\b|one[ .-]?time[ .-]?password|\bpin\b|\bpassword\b|verification code|\bcode\b|ओटीपी|पिन|पासवर्ड)/gi;
const OTP_NUMBER = new RegExp(`${LEFT}\\d{4,8}${RIGHT}`, 'g');

const ORDER: RedactionCategory[] = [
  'EMAIL',
  'UPI',
  'PAN',
  'CARD',
  'AADHAAR',
  'PHONE',
  'OTP',
  'ACCOUNT',
];

function collect(
  text: string,
  re: RegExp,
  category: RedactionCategory,
  accept?: (value: string, start: number) => boolean,
): Candidate[] {
  const out: Candidate[] = [];
  re.lastIndex = 0;
  for (const m of text.matchAll(re)) {
    const value = m[0];
    const start = m.index ?? 0;
    if (accept && !accept(value, start)) continue;
    out.push({ start, end: start + value.length, value, category });
  }
  return out;
}

/** 4–8 digit numbers sitting within 30 characters of an OTP/PIN/password word. */
function otpCandidates(text: string): Candidate[] {
  const keywordSpans: Array<[number, number]> = [];
  OTP_KEYWORD.lastIndex = 0;
  for (const m of text.matchAll(OTP_KEYWORD)) {
    const s = m.index ?? 0;
    keywordSpans.push([s, s + m[0].length]);
  }
  if (keywordSpans.length === 0) return [];
  const out: Candidate[] = [];
  for (const m of text.matchAll(OTP_NUMBER)) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    const near = keywordSpans.some(
      ([ks, ke]) => Math.abs(start - ke) <= 30 || Math.abs(ks - end) <= 30,
    );
    if (near) out.push({ start, end, value: m[0], category: 'OTP' });
  }
  return out;
}

export function redact(text: string): RedactionResult {
  if (!text) return { redacted: '', map: {}, counts: {} };

  const protectedRanges = urlRanges(text);
  const insideUrl = (start: number, end: number) =>
    protectedRanges.some(([s, e]) => start < e && end > s);

  const emails = collect(text, EMAIL_RE, 'EMAIL');
  const emailRanges = emails.map((e) => [e.start, e.end] as [number, number]);

  const byCategory: Record<RedactionCategory, Candidate[]> = {
    EMAIL: emails,
    UPI: collect(text, UPI_RE, 'UPI', (_v, start) =>
      !emailRanges.some(([s, e]) => start >= s && start < e),
    ),
    PAN: collect(text, PAN_RE, 'PAN'),
    AADHAAR: collect(text, AADHAAR_RE, 'AADHAAR', (v) => v.replace(/\D/g, '').length === 12),
    CARD: collect(text, CARDLIKE_RE, 'CARD', (v) => luhn(v)),
    PHONE: collect(text, PHONE_RE, 'PHONE', (v) => {
      const d = v.replace(/\D/g, '');
      return d.length === 10 || (d.length === 11 && d.startsWith('0')) || (d.length === 12 && d.startsWith('91'));
    }),
    OTP: otpCandidates(text),
    ACCOUNT: collect(text, ACCOUNT_RE, 'ACCOUNT'),
  };

  // Resolve overlaps by category priority, then by earliest start.
  const chosen: Candidate[] = [];
  const claimed: Array<[number, number]> = [];
  const clashes = (c: Candidate) =>
    claimed.some(([s, e]) => c.start < e && c.end > s);

  for (const category of ORDER) {
    for (const c of byCategory[category].sort((a, b) => a.start - b.start)) {
      if (insideUrl(c.start, c.end)) continue;
      if (clashes(c)) continue;
      claimed.push([c.start, c.end]);
      chosen.push(c);
    }
  }

  chosen.sort((a, b) => a.start - b.start);

  const map: Record<string, string> = {};
  const counts: Partial<Record<RedactionCategory, number>> = {};
  const seen = new Map<string, string>(); // category|normalised value -> token

  let out = '';
  let cursor = 0;
  for (const c of chosen) {
    const key = `${c.category}|${c.value.replace(/[ -]/g, '').toLowerCase()}`;
    let token = seen.get(key);
    if (!token) {
      const next = (counts[c.category] ?? 0) + 1;
      counts[c.category] = next;
      token = `[${c.category}_${next}]`;
      seen.set(key, token);
      map[token] = c.value;
    }
    out += text.slice(cursor, c.start) + token;
    cursor = c.end;
  }
  out += text.slice(cursor);

  return { redacted: out, map, counts };
}

/** Replace tokens with their original values, used to map AI quotes back to the input. */
export function restore(text: string, map: Record<string, string>): string {
  let out = text;
  for (const [token, original] of Object.entries(map)) {
    out = out.split(token).join(original);
  }
  return out;
}

export function totalMasked(counts: Partial<Record<RedactionCategory, number>>): number {
  return Object.values(counts).reduce<number>((a, b) => a + (b ?? 0), 0);
}

export const CATEGORY_LABELS: Record<RedactionCategory, { en: string; hi: string }> = {
  PHONE: { en: 'Phone number', hi: 'फ़ोन नंबर' },
  EMAIL: { en: 'Email address', hi: 'ईमेल पता' },
  AADHAAR: { en: 'Aadhaar-like number', hi: 'आधार जैसा नंबर' },
  PAN: { en: 'PAN', hi: 'पैन' },
  CARD: { en: 'Card number', hi: 'कार्ड नंबर' },
  ACCOUNT: { en: 'Account-like number', hi: 'खाता जैसा नंबर' },
  UPI: { en: 'UPI ID', hi: 'यूपीआई आईडी' },
  OTP: { en: 'OTP / PIN', hi: 'ओटीपी / पिन' },
};
