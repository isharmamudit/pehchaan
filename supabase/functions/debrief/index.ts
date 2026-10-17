/**
 * debrief — the coaching summary after a sparring round.
 * Quotes must come from the transcript; anything unusable falls back to the
 * client's static debrief for that persona.
 */

import { clientIp, json, serveFunction } from '../_shared/http.ts';
import { rateLimit } from '../_shared/rateLimit.ts';
import { generateJson, geminiConfigured } from '../_shared/gemini.ts';
import { DEBRIEF_SCHEMA } from '../_shared/schema.ts';
import { debriefSystemPrompt, debriefUserPrompt } from '../_shared/prompts.ts';
import { PERSONA_IDS, type PersonaId } from '../_shared/personaConfig.ts';
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

interface DebriefPayload {
  tactics_seen?: Array<{ tactic?: string; quote?: string }>;
  did_well?: string[];
  improve?: Array<{ moment?: string; safer_response?: string }>;
}

/** Normalise for quote checking: lowercase, collapse whitespace. */
function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

export const handler = async (req: Request): Promise<Response> => {
  const limit = rateLimit(`debrief:${clientIp(req)}`);
  if (!limit.allowed) {
    return json(req, { error: 'rate_limited', retryAfterSeconds: limit.retryAfterSeconds }, 429);
  }

  let language: 'en' | 'hi';
  let history: Array<{ role: string; text: string }>;
  let knownFacts: string[];

  try {
    const body = await readJson(req);
    oneOf<PersonaId>(body.personaId, 'personaId', PERSONA_IDS);
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
  } catch (err) {
    const code = err instanceof ValidationError ? err.code : 'invalid_request';
    return json(req, { error: code }, 400);
  }

  if (!history.length) return json(req, { error: 'empty_history' }, 400);
  if (!geminiConfigured()) {
    return json(req, { fallback_required: true, reason: 'not_configured' });
  }

  const result = await generateJson<DebriefPayload>({
    system: debriefSystemPrompt(language),
    user: debriefUserPrompt(history, knownFacts),
    responseSchema: DEBRIEF_SCHEMA,
    temperature: 0.3,
    maxOutputTokens: 1024,
    timeoutMs: 9000,
  });

  if (!result.ok) {
    return json(req, { fallback_required: true, reason: result.reason });
  }

  // A quote must actually appear in a scammer line, or it is dropped.
  const scammerText = norm(
    history.filter((m) => m.role === 'scammer').map((m) => m.text).join(' • '),
  );

  const tactics_seen = (result.data.tactics_seen ?? [])
    .filter((t) => t.quote && (TACTIC_IDS as readonly string[]).includes(t.tactic ?? ''))
    .filter((t) => scammerText.includes(norm(t.quote!)))
    .slice(0, 6)
    .map((t) => ({ tactic: t.tactic!, quote: t.quote!.slice(0, 200) }));

  const did_well = (result.data.did_well ?? [])
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .slice(0, 4)
    .map((s) => s.slice(0, 240));

  const improve = (result.data.improve ?? [])
    .filter((i) => i.moment && i.safer_response)
    .slice(0, 4)
    .map((i) => ({
      moment: i.moment!.slice(0, 200),
      safer_response: i.safer_response!.slice(0, 240),
    }));

  if (!did_well.length && !improve.length) {
    return json(req, { fallback_required: true, reason: 'empty' });
  }

  return json(req, { tactics_seen, did_well, improve });
};

Deno.serve(serveFunction({ name: 'debrief', handler }));
