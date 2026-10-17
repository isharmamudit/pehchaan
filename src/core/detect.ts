/** Auto-detect what the user pasted. The UI always shows "Detected as … (change)". */

import { extractUrls } from './urls';
import { runHoaxTemplates } from './hoaxTemplates';
import type { InputType } from './types';

export function detectInputType(text: string): InputType {
  const trimmed = text.trim();
  if (!trimmed) return 'message';

  const urls = extractUrls(trimmed);
  // Nothing but a link.
  if (urls.length === 1 && urls[0]!.raw.length >= trimmed.length - 2) return 'url';

  if (/^upi:\/\//i.test(trimmed)) return 'qr';

  // Forward markers, chain-letter shape, or a known hoax template.
  const forwardish =
    /forwarded (as received|many times)|🙏|share (this )?with|फ़ॉरवर्ड|फॉरवर्ड/i.test(trimmed) ||
    runHoaxTemplates(trimmed).length > 0;
  if (forwardish && trimmed.length > 120) return 'claim_forward';

  return 'message';
}

export const INPUT_TYPE_LABELS: Record<InputType, { en: string; hi: string }> = {
  message: { en: 'Message', hi: 'संदेश' },
  url: { en: 'Link', hi: 'लिंक' },
  claim_forward: { en: 'Viral forward', hi: 'वायरल फ़ॉरवर्ड' },
  screenshot: { en: 'Screenshot', hi: 'स्क्रीनशॉट' },
  qr: { en: 'QR code', hi: 'क्यूआर कोड' },
  voice_transcript: { en: 'Call description', hi: 'कॉल का विवरण' },
};
