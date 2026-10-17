/**
 * Screenshot reading. The image is downscaled and re-encoded first (stripping
 * metadata); the extracted text then runs through the normal local pipeline.
 */

import { callFunction } from './api';
import { downscaleToJpeg } from './image';
import type { OcrResponse } from '../core/contracts';

export type OcrResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'unavailable' | 'empty' };

export async function readScreenshot(file: Blob): Promise<OcrResult> {
  const image = await downscaleToJpeg(file, 1600, 0.9);

  const res = await callFunction<OcrResponse>(
    'ocr',
    { imageBase64: image.base64, mimeType: image.mimeType },
    { timeoutMs: 15000 },
  );

  if (!res.ok || res.data.ai_unavailable) return { ok: false, reason: 'unavailable' };
  const text = (res.data.text ?? '').trim();
  if (!text) return { ok: false, reason: 'empty' };
  return { ok: true, text };
}

export const SCREENSHOT_CONSENT = {
  en: 'The screenshot will be sent to Google Gemini to read the text. Crop out names if you can.',
  hi: 'टेक्स्ट पढ़ने के लिए यह स्क्रीनशॉट गूगल जेमिनी को भेजा जाएगा। हो सके तो नाम काट दीजिए।',
};
