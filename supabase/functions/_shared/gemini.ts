/**
 * Gemini REST client. The model name comes from the GEMINI_MODEL secret —
 * never hardcoded — and the key never leaves the server.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

export type GeminiFailure =
  | 'no_key'
  | 'no_model'
  | 'timeout'
  | 'http_error'
  | 'blocked'
  | 'empty'
  | 'bad_json';

export type GeminiResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: GeminiFailure };

export interface InlineImage {
  mimeType: string;
  data: string; // base64, no data: prefix
}

export interface GenerateOptions {
  system: string;
  user: string;
  image?: InlineImage;
  /** JSON schema for structured output. Omit for a free-text call. */
  responseSchema?: unknown;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  /** Enables the Google Search tool. Cannot be combined with responseSchema. */
  grounded?: boolean;
  /**
   * Thinking tokens come out of maxOutputTokens, so a reasoning model can spend
   * the whole budget deliberating and return a truncated, unparseable answer.
   * These are extraction and role-play tasks, not puzzles, so thinking is off
   * by default: it is faster and it stops MAX_TOKENS truncation.
   */
  thinkingBudget?: number;
}

function config(): { key: string; model: string } | null {
  const key = Deno.env.get('GEMINI_API_KEY');
  const model = Deno.env.get('GEMINI_MODEL');
  if (!key || !model) return null;
  return { key, model };
}

export function geminiConfigured(): boolean {
  return config() !== null;
}

interface RawResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
    groundingMetadata?: unknown;
  }>;
  promptFeedback?: { blockReason?: string };
}

async function call(options: GenerateOptions): Promise<GeminiResult<RawResponse>> {
  const cfg = config();
  if (!cfg) return { ok: false, reason: Deno.env.get('GEMINI_API_KEY') ? 'no_model' : 'no_key' };

  const parts: Array<Record<string, unknown>> = [{ text: options.user }];
  if (options.image) {
    parts.unshift({
      inline_data: { mime_type: options.image.mimeType, data: options.image.data },
    });
  }

  const generationConfig: Record<string, unknown> = {
    temperature: options.temperature ?? 0.2,
    maxOutputTokens: options.maxOutputTokens ?? 2048,
    thinkingConfig: { thinkingBudget: options.thinkingBudget ?? 0 },
  };
  if (options.responseSchema && !options.grounded) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = options.responseSchema;
  }

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts }],
    systemInstruction: { parts: [{ text: options.system }] },
    generationConfig,
  };
  if (options.grounded) {
    body.tools = [{ google_search: {} }];
  }

  const url = `${ENDPOINT}/${encodeURIComponent(cfg.model)}:generateContent?key=${encodeURIComponent(cfg.key)}`;
  const deadline = Date.now() + (options.timeoutMs ?? 10000);

  /** Rate limits and capacity spikes are transient; everything else is not. */
  const RETRYABLE = new Set([429, 500, 502, 503, 504]);

  for (let attempt = 0; attempt < 2; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 300) break;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remaining);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (res.ok) {
        const data = (await res.json()) as RawResponse;
        return { ok: true, data };
      }

      await res.body?.cancel();
      if (!RETRYABLE.has(res.status) || attempt === 1) {
        return { ok: false, reason: 'http_error' };
      }
      await new Promise((resolve) => setTimeout(resolve, 700));
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      if (aborted || attempt === 1) {
        return { ok: false, reason: aborted ? 'timeout' : 'http_error' };
      }
    } finally {
      clearTimeout(timer);
    }
  }

  return { ok: false, reason: 'timeout' };
}

function textOf(raw: RawResponse): string | null {
  if (raw.promptFeedback?.blockReason) return null;
  const candidate = raw.candidates?.[0];
  if (!candidate) return null;
  if (candidate.finishReason === 'SAFETY' || candidate.finishReason === 'RECITATION') return null;
  const text = candidate.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  return text.trim() ? text : null;
}

/** Structured call. Returns parsed JSON or a failure reason — never throws. */
export async function generateJson<T>(options: GenerateOptions): Promise<GeminiResult<T>> {
  const raw = await call(options);
  if (!raw.ok) return raw;

  const text = textOf(raw.data);
  if (text === null) {
    return { ok: false, reason: raw.data.promptFeedback?.blockReason ? 'blocked' : 'empty' };
  }

  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  try {
    return { ok: true, data: JSON.parse(cleaned) as T };
  } catch {
    return { ok: false, reason: 'bad_json' };
  }
}

export interface GroundedResult {
  text: string;
  groundingMetadata?: unknown;
}

/** Free-text call with the Google Search tool, used for claim grounding. */
export async function generateGrounded(
  options: Omit<GenerateOptions, 'responseSchema' | 'grounded'>,
): Promise<GeminiResult<GroundedResult>> {
  const raw = await call({ ...options, grounded: true });
  if (!raw.ok) return raw;
  const text = textOf(raw.data);
  if (text === null) return { ok: false, reason: 'blocked' };
  return {
    ok: true,
    data: { text, groundingMetadata: raw.data.candidates?.[0]?.groundingMetadata },
  };
}
