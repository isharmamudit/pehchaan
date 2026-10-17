/**
 * analyze — Gemini explains; it never decides the verdict and never invents
 * evidence. Returns { ai_unavailable: true } honestly whenever it cannot help.
 */

import { clientIp, json, serveFunction } from '../_shared/http.ts';
import { rateLimit } from '../_shared/rateLimit.ts';
import { generateJson, geminiConfigured } from '../_shared/gemini.ts';
import { ANALYZE_SCHEMA } from '../_shared/schema.ts';
import { analyzeSystemPrompt, analyzeUserPrompt } from '../_shared/prompts.ts';
import {
  arr,
  INPUT_TYPES,
  LANGS,
  LIMITS,
  oneOf,
  readJson,
  str,
  TACTIC_IDS,
  ValidationError,
} from '../_shared/validate.ts';

interface AiFinding {
  text: string;
  tactic: string;
  explanation: string;
}

interface AiClaim {
  text: string;
  kind: string;
  topic: string;
  search_query: string;
}

interface AiPayload {
  input_type?: string;
  language?: string;
  findings?: AiFinding[];
  claims?: AiClaim[];
  summary?: string;
}

const CLAIM_TOPICS = ['banking_currency', 'government_scheme', 'elections', 'health', 'other'];

function cleanFindings(raw: unknown): AiFinding[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f): f is AiFinding =>
      Boolean(
        f &&
          typeof f === 'object' &&
          typeof (f as AiFinding).text === 'string' &&
          (TACTIC_IDS as readonly string[]).includes((f as AiFinding).tactic),
      ),
    )
    .slice(0, 20)
    .map((f) => ({
      text: f.text.slice(0, 300),
      tactic: f.tactic,
      explanation: String(f.explanation ?? '').slice(0, 240),
    }));
}

function cleanClaims(raw: unknown): AiClaim[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c): c is AiClaim => Boolean(c && typeof c === 'object' && typeof (c as AiClaim).text === 'string'))
    .slice(0, LIMITS.claims)
    .map((c) => ({
      text: c.text.slice(0, 400),
      kind: ['opinion', 'bait', 'unverifiable'].includes(c.kind) ? c.kind : 'checkable',
      topic: CLAIM_TOPICS.includes(c.topic) ? c.topic : 'other',
      search_query: String(c.search_query ?? c.text ?? '').slice(0, LIMITS.queryChars),
    }));
}

export const handler = async (req: Request): Promise<Response> => {
  const limit = rateLimit(`analyze:${clientIp(req)}`);
  if (!limit.allowed) {
    return json(req, { error: 'rate_limited', retryAfterSeconds: limit.retryAfterSeconds }, 429);
  }

  let text: string;
  let language: 'en' | 'hi';
  let inputType: string;
  let ruleFindings: Array<{ tactic: string; text: string }>;

  try {
    const body = await readJson(req);
    text = str(body.text, 'text', { max: LIMITS.text });
    language = oneOf(body.language, 'language', LANGS, 'en');
    inputType = oneOf(body.inputType, 'inputType', INPUT_TYPES, 'message');
    ruleFindings = arr(body.ruleFindings, 'ruleFindings', 40)
      .filter((r): r is { tactic: string; text: string } =>
        Boolean(r && typeof r === 'object'),
      )
      .map((r) => ({
        tactic: (TACTIC_IDS as readonly string[]).includes(r.tactic) ? r.tactic : 'other',
        text: String(r.text ?? '').slice(0, 200),
      }));
  } catch (err) {
    const code = err instanceof ValidationError ? err.code : 'invalid_request';
    return json(req, { error: code }, 400);
  }

  if (!geminiConfigured()) {
    return json(req, { ai_unavailable: true, reason: 'not_configured' });
  }

  const result = await generateJson<AiPayload>({
    system: analyzeSystemPrompt(language),
    user: analyzeUserPrompt(text, inputType, ruleFindings),
    responseSchema: ANALYZE_SCHEMA,
    temperature: 0.2,
    timeoutMs: 14000,
    maxOutputTokens: 2048,
  });

  if (!result.ok) {
    return json(req, { ai_unavailable: true, reason: result.reason });
  }

  return json(req, {
    input_type: inputType,
    language: result.data.language ?? language,
    findings: cleanFindings(result.data.findings),
    claims: cleanClaims(result.data.claims),
    summary: String(result.data.summary ?? '').slice(0, 300),
  });
};

Deno.serve(serveFunction({ name: 'analyze', handler }));
