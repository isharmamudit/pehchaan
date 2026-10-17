/**
 * ocr — reads the text out of an uploaded screenshot with Gemini vision.
 * The extracted text goes straight back to the browser, where the rules run
 * on it locally and the privacy shield masks it before any further call.
 */

import { clientIp, json, serveFunction } from '../_shared/http.ts';
import { rateLimit } from '../_shared/rateLimit.ts';
import { generateJson, geminiConfigured } from '../_shared/gemini.ts';
import { OCR_SCHEMA } from '../_shared/schema.ts';
import { OCR_SYSTEM_PROMPT } from '../_shared/prompts.ts';
import { base64Image, LIMITS, oneOf, readJson, ValidationError } from '../_shared/validate.ts';

export const handler = async (req: Request): Promise<Response> => {
  const limit = rateLimit(`ocr:${clientIp(req)}`, { limit: 20 });
  if (!limit.allowed) {
    return json(req, { error: 'rate_limited', retryAfterSeconds: limit.retryAfterSeconds }, 429);
  }

  let imageBase64: string;
  let mimeType: string;
  try {
    const body = await readJson(req);
    imageBase64 = base64Image(body.imageBase64, 'imageBase64');
    mimeType = oneOf(body.mimeType, 'mimeType', ['image/jpeg', 'image/png'] as const, 'image/jpeg');
  } catch (err) {
    const code = err instanceof ValidationError ? err.code : 'invalid_request';
    return json(req, { error: code }, 400);
  }

  if (imageBase64.length > LIMITS.imageBase64Bytes) {
    return json(req, { error: 'image_too_large' }, 413);
  }
  if (!geminiConfigured()) {
    return json(req, { ai_unavailable: true, reason: 'not_configured' });
  }

  const result = await generateJson<{ text?: string }>({
    system: OCR_SYSTEM_PROMPT,
    user: 'Transcribe all text visible in this image.',
    image: { mimeType, data: imageBase64 },
    responseSchema: OCR_SCHEMA,
    temperature: 0,
    maxOutputTokens: 1536,
    timeoutMs: 12000,
  });

  if (!result.ok) {
    return json(req, { ai_unavailable: true, reason: result.reason });
  }

  return json(req, { text: String(result.data.text ?? '').slice(0, LIMITS.text) });
};

Deno.serve(serveFunction({ name: 'ocr', handler }));
