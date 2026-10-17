/**
 * Sparring and debrief clients. Every failure path falls back to the scripted
 * dialogue or the static debrief, so a round always completes.
 */

import { callFunction } from './api';
import { redact } from '../core/redact';
import { fallbackReply, type SparSession } from '../core/sparring';
import { staticDebrief } from '../core/debrief';
import type { PersonaId, PersonalisedTemplate } from '../core/personas';
import type { Lever } from '../core/levers';
import type { DebriefResponse, SparMessage, SparResponse } from '../core/contracts';

/**
 * The user's own turns go through the privacy shield before they are sent,
 * exactly like Check input. The scammer's lines are ours, so they go as-is.
 */
export function shieldHistory(history: SparMessage[]): SparMessage[] {
  return history.map((m) =>
    m.role === 'user' ? { ...m, text: redact(m.text).redacted } : m,
  );
}

export interface TurnOptions {
  knownFacts?: string[];
  template?: PersonalisedTemplate['key'];
  /** Adaptive sparring: the lever this person folds under. */
  targetLever?: Lever;
}

interface SparApiResponse extends Partial<SparResponse> {
  fallback_required?: boolean;
}

export async function nextSparTurn(
  session: SparSession,
  userText: string,
  options: TurnOptions = {},
): Promise<SparResponse> {
  const history = [...session.messages, { role: 'user' as const, text: userText }];

  const res = await callFunction<SparApiResponse>(
    'spar',
    {
      personaId: session.personaId,
      language: session.lang,
      history: shieldHistory(history.slice(-20)),
      knownFacts: options.knownFacts ?? [],
      ...(options.template ? { template: options.template } : {}),
      ...(options.targetLever ? { targetLever: options.targetLever } : {}),
    },
    { timeoutMs: 10000 },
  );

  if (!res.ok || res.data.fallback_required || !res.data.reply) {
    return fallbackReply(session.personaId, session.userTurns, userText, session.lang);
  }

  return {
    reply: res.data.reply,
    tactics_used: res.data.tactics_used ?? [],
    user_turn_tags: res.data.user_turn_tags ?? [],
    should_end: Boolean(res.data.should_end),
  };
}

interface DebriefApiResponse extends Partial<DebriefResponse> {
  fallback_required?: boolean;
}

export async function getDebrief(
  session: SparSession,
  knownFacts: string[] = [],
): Promise<DebriefResponse> {
  const res = await callFunction<DebriefApiResponse>(
    'debrief',
    {
      personaId: session.personaId,
      language: session.lang,
      history: shieldHistory(session.messages.slice(-20)),
      knownFacts,
    },
    { timeoutMs: 10000 },
  );

  if (!res.ok || res.data.fallback_required || !res.data.did_well?.length) {
    return staticDebrief(session.personaId, session.lang, session.messages, knownFacts);
  }

  return {
    tactics_seen: res.data.tactics_seen ?? [],
    did_well: res.data.did_well,
    improve: res.data.improve ?? [],
  };
}

export function personaDeepLink(personaId: PersonaId): string {
  return `/practise/${personaId}`;
}
