/**
 * Breached-password check using k-anonymity. The password never leaves the
 * device: it is hashed here, and only the first 5 hex characters of the hash
 * are sent. Nothing is stored.
 */

const RANGE_ENDPOINT = 'https://api.pwnedpasswords.com/range/';

export async function sha1Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export type BreachCheck =
  | { ok: true; count: number }
  | { ok: false; error: 'network' | 'unsupported' };

export async function checkPassword(password: string): Promise<BreachCheck> {
  if (!crypto?.subtle) return { ok: false, error: 'unsupported' };

  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const res = await fetch(`${RANGE_ENDPOINT}${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });
    if (!res.ok) return { ok: false, error: 'network' };

    const body = await res.text();
    for (const line of body.split('\n')) {
      const [lineSuffix, countText] = line.trim().split(':');
      if (lineSuffix === suffix) {
        return { ok: true, count: Number(countText ?? 0) };
      }
    }
    return { ok: true, count: 0 };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export const K_ANONYMITY_NOTE = {
  en: 'Your password is hashed on your device; only the first 5 characters of that hash are sent, so the service never learns your password.',
  hi: 'आपका पासवर्ड आपके डिवाइस पर ही हैश होता है; उस हैश के सिर्फ़ पहले 5 अक्षर भेजे जाते हैं, इसलिए सेवा को आपका पासवर्ड कभी पता नहीं चलता।',
};
