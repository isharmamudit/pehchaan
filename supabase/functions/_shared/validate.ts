/** Input validation. Every function validates type, size and enums. */

export class ValidationError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export const LIMITS = {
  text: 5000,
  caption: 1000,
  historyTurns: 20,
  messageChars: 2000,
  urls: 10,
  urlChars: 2048,
  imageBase64Bytes: 4 * 1024 * 1024 * 1.37, // ~4 MB binary after base64
  claims: 8,
  queryChars: 200,
  knownFacts: 10,
  factChars: 200,
} as const;

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ValidationError('invalid_json');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('invalid_body');
  }
  return body as Record<string, unknown>;
}

export function str(
  value: unknown,
  field: string,
  { max, required = true }: { max: number; required?: boolean },
): string {
  if (value === undefined || value === null || value === '') {
    if (required) throw new ValidationError(`missing_${field}`);
    return '';
  }
  if (typeof value !== 'string') throw new ValidationError(`invalid_${field}`);
  if (value.length > max) throw new ValidationError(`${field}_too_long`);
  return value;
}

export function oneOf<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  fallback?: T,
): T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  if (fallback !== undefined) return fallback;
  throw new ValidationError(`invalid_${field}`);
}

export function arr(value: unknown, field: string, max: number): unknown[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new ValidationError(`invalid_${field}`);
  if (value.length > max) throw new ValidationError(`${field}_too_many`);
  return value;
}

export function base64Image(value: unknown, field: string): string {
  const s = str(value, field, { max: Math.ceil(LIMITS.imageBase64Bytes) });
  const cleaned = s.replace(/^data:[^;]+;base64,/, '');
  if (!/^[A-Za-z0-9+/=\s]+$/.test(cleaned)) throw new ValidationError(`invalid_${field}`);
  return cleaned.replace(/\s+/g, '');
}

export const LANGS = ['en', 'hi'] as const;
export const INPUT_TYPES = [
  'message',
  'url',
  'claim_forward',
  'screenshot',
  'qr',
  'voice_transcript',
] as const;
export const TACTIC_IDS = [
  'false_urgency',
  'threat_fear',
  'fake_authority',
  'credential_request',
  'remote_access',
  'payment_request',
  'too_good_to_be_true',
  'secrecy_isolation',
  'suspicious_link',
] as const;
