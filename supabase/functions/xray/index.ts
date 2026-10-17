/**
 * xray — Post X-Ray vision pass. The image arrives already downscaled and
 * re-encoded in the browser, so metadata is stripped before it is ever sent.
 * Nothing is stored; the image exists only for the lifetime of this request.
 */

import { clientIp, json, serveFunction } from '../_shared/http.ts';
import { rateLimit } from '../_shared/rateLimit.ts';
import { generateJson, geminiConfigured } from '../_shared/gemini.ts';
import { XRAY_SCHEMA } from '../_shared/schema.ts';
import { xraySystemPrompt, xrayUserPrompt } from '../_shared/prompts.ts';
import {
  base64Image,
  LANGS,
  LIMITS,
  oneOf,
  readJson,
  str,
  ValidationError,
} from '../_shared/validate.ts';

const VISUAL_LABELS = [
  'school_logo', 'uniform', 'house_number', 'vehicle_plate', 'id_document',
  'boarding_pass', 'screen_content', 'street_sign', 'landmark', 'other',
];
const CAPTION_TYPES = [
  'school', 'location', 'absence', 'birthday', 'contact', 'family', 'routine',
];

interface XrayPayload {
  visual_leaks?: Array<{ label?: string; description?: string; box?: number[] }>;
  caption_leaks?: Array<{ text?: string; type?: string; explanation?: string }>;
  stranger_learns?: string[];
  caption_rewrite?: string;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function validBox(box: unknown): box is number[] {
  return (
    Array.isArray(box) &&
    box.length === 4 &&
    box.every((n) => typeof n === 'number' && n >= 0 && n <= 1000)
  );
}

export const handler = async (req: Request): Promise<Response> => {
  const limit = rateLimit(`xray:${clientIp(req)}`, { limit: 15 });
  if (!limit.allowed) {
    return json(req, { error: 'rate_limited', retryAfterSeconds: limit.retryAfterSeconds }, 429);
  }

  let imageBase64: string;
  let mimeType: string;
  let caption: string;
  let language: 'en' | 'hi';

  try {
    const body = await readJson(req);
    imageBase64 = base64Image(body.imageBase64, 'imageBase64');
    mimeType = oneOf(body.mimeType, 'mimeType', ['image/jpeg', 'image/png'] as const, 'image/jpeg');
    caption = str(body.caption, 'caption', { max: LIMITS.caption, required: false });
    language = oneOf(body.language, 'language', LANGS, 'en');
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

  const result = await generateJson<XrayPayload>({
    system: xraySystemPrompt(language),
    user: xrayUserPrompt(caption),
    image: { mimeType, data: imageBase64 },
    responseSchema: XRAY_SCHEMA,
    temperature: 0.2,
    maxOutputTokens: 1536,
    timeoutMs: 15000,
  });

  if (!result.ok) {
    return json(req, { ai_unavailable: true, reason: result.reason });
  }

  const captionNorm = norm(caption);

  return json(req, {
    visual_leaks: (result.data.visual_leaks ?? [])
      .filter((v) => VISUAL_LABELS.includes(v.label ?? '') && validBox(v.box))
      .slice(0, 10)
      .map((v) => ({
        label: v.label!,
        description: String(v.description ?? '').slice(0, 200),
        box: v.box as [number, number, number, number],
      })),
    // Caption quotes are verified against the caption; invented ones are dropped.
    caption_leaks: (result.data.caption_leaks ?? [])
      .filter((c) => typeof c.text === 'string' && CAPTION_TYPES.includes(c.type ?? ''))
      .filter((c) => captionNorm.includes(norm(c.text!)))
      .slice(0, 10)
      .map((c) => ({
        text: c.text!.slice(0, 200),
        type: c.type!,
        explanation: String(c.explanation ?? '').slice(0, 240),
      })),
    stranger_learns: (result.data.stranger_learns ?? [])
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .slice(0, 6)
      .map((s) => s.slice(0, 120)),
    caption_rewrite: String(result.data.caption_rewrite ?? '').slice(0, LIMITS.caption),
  });
};

Deno.serve(serveFunction({ name: 'xray', handler }));
