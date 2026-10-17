/**
 * spar — one turn of the training simulation. If Gemini is unavailable,
 * blocked, or returns nothing usable, this responds with
 * { fallback_required: true } and the client plays its scripted dialogue.
 */

import { clientIp, json, serveFunction } from '../_shared/http.ts';
import { rateLimit } from '../_shared/rateLimit.ts';
import { generateJson, geminiConfigured } from '../_shared/gemini.ts';
import { SPAR_SCHEMA } from '../_shared/schema.ts';
import { sparSystemPrompt, sparUserPrompt } from '../_shared/prompts.ts';
import {
  PERSONA_IDS,
  resolvePersona,
  TEMPLATE_KEYS,
  type PersonaId,
  type TemplateKey,
} from '../_shared/personaConfig.ts';
import {
  arr,
  LANGS,
  LIMITS,
  oneOf,
  readJson,
  str,
  TACTIC_IDS,
  ValidationError,
} from '../_shared/validate.ts';

const LEVERS = ['fear', 'authority', 'greed', 'urgency', 'trust'] as const;

const TAGS = [
  'spotted_sign',
  'refused_info',
  'shared_info',
  'proposed_verification',
  'disengaged',
  'engaged',
] as const;

interface SparPayload {
  reply?: string;
  tactics_used?: string[];
  user_turn_tags?: string[];
  should_end?: boolean;
}

function clampWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  return words.length <= maxWords ? text.trim() : `${words.slice(0, maxWords).join(' ')}…`;
}

export const handler = async (req: Request): Promise<Response> => {
  const limit = rateLimit(`spar:${clientIp(req)}`);
  if (!limit.allowed) {
    return json(req, { error: 'rate_limited', retryAfterSeconds: limit.retryAfterSeconds }, 429);
  }

  let personaId: PersonaId;
  let template: TemplateKey | undefined;
  let language: 'en' | 'hi';
  let history: Array<{ role: string; text: string }>;
  let knownFacts: string[];
  let targetLever: (typeof LEVERS)[number] | undefined;

  try {
    const body = await readJson(req);
    personaId = oneOf(body.personaId, 'personaId', PERSONA_IDS);
    template = body.template === undefined
      ? undefined
      : oneOf(body.template, 'template', TEMPLATE_KEYS);
    language = oneOf(body.language, 'language', LANGS, 'en');
    history = arr(body.history, 'history', LIMITS.historyTurns)
      .filter((m): m is Record<string, unknown> => Boolean(m && typeof m === 'object'))
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'scammer',
        text: str(m.text, 'message', { max: LIMITS.messageChars, required: false }),
      }))
      .filter((m) => m.text.length > 0);
    knownFacts = arr(body.knownFacts, 'knownFacts', LIMITS.knownFacts)
      .filter((f): f is string => typeof f === 'string')
      .map((f) => f.slice(0, LIMITS.factChars));
    targetLever = body.targetLever === undefined
      ? undefined
      : oneOf(body.targetLever, 'targetLever', LEVERS);
  } catch (err) {
    const code = err instanceof ValidationError ? err.code : 'invalid_request';
    return json(req, { error: code }, 400);
  }

  if (!history.length) return json(req, { error: 'empty_history' }, 400);
  if (!geminiConfigured()) {
    return json(req, { fallback_required: true, reason: 'not_configured' });
  }

  const persona = resolvePersona(personaId, template);

  const result = await generateJson<SparPayload>({
    system: sparSystemPrompt(
      language,
      persona.name,
      persona.escalation,
      knownFacts,
      targetLever,
    ),
    user: sparUserPrompt(history),
    responseSchema: SPAR_SCHEMA,
    temperature: 0.7,
    maxOutputTokens: 700,
    timeoutMs: 9000,
  });

  if (!result.ok || !result.data.reply?.trim()) {
    return json(req, { fallback_required: true, reason: result.ok ? 'empty' : result.reason });
  }

  return json(req, {
    reply: clampWords(result.data.reply, 50),
    tactics_used: (result.data.tactics_used ?? [])
      .filter((t) => (TACTIC_IDS as readonly string[]).includes(t))
      .slice(0, 4),
    user_turn_tags: (result.data.user_turn_tags ?? [])
      .filter((t) => (TAGS as readonly string[]).includes(t))
      .slice(0, 4),
    should_end: Boolean(result.data.should_end),
  });
};

Deno.serve(serveFunction({ name: 'spar', handler }));
