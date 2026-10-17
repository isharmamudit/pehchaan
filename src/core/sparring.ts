/**
 * Sparring session logic: intent detection, turn tagging, the scripted
 * fallback engine and scoring. Scoring is code, never the AI's opinion.
 */

import { PERSONAS, type Intent, type PersonaId } from './personas';
import { redact, totalMasked } from './redact';
import type { Lang, Localised, TacticId } from './tactics';
import type { SparMessage, SparResponse, UserTurnTag } from './contracts';

export const MAX_USER_TURNS = 8;

/* ------------------------------------------------------------ intent & tags */

const LEAVE_RE =
  /\b(hang(ing)? up|cut(ting)? the call|goodbye|bye|block(ing)? (you|this number)|not interested|i('?m| am) done|stop calling|report(ing)? (you|this)|phone rakh|call kaat|band karo)\b|फ़ोन रख|कॉल काट|बंद कर/i;
const VERIFY_RE =
  /\b(i('?ll| will)? (call|check|verify|confirm)|official (number|website|app)|branch|1930|cybercrime\.gov\.in|visit the bank|customer care|khud (call|check)|apne aap)\b|आधिकारिक|ख़ुद जाँच|खुद जांच|शाखा|बैंक जाकर/i;
const REFUSE_RE =
  /\b(no\b|nope|never|not going to|won'?t|will not|i refuse|cannot share|can'?t share|nahi(n)? (dunga|dungi|batau?nga|bataungi)?|mana|refuse)\b|नहीं|मना/i;
const QUESTION_RE = /\?|^(who|which|what|why|how|where|kaun|kaunsa|kyun|kaise)\b/i;
const COMPLY_RE =
  /\b(ok(ay)?|sure|done|sent|sending|paid|installed|here('?s| is)|yes|haan|theek hai|kar diya|bhej diya|de diya)\b|ठीक है|हाँ|भेज दिया|कर दिया/i;
const SECRET_RE = /\b\d{4,8}\b|\b(otp|pin|cvv|password|aadhaar|aadhar)\b.{0,10}\b(is|=|:)/i;
const PAYMENT_COMPLY_RE =
  /\b(paid|transferred|sent (the )?(money|amount|rs|₹)|payment done|upi (sent|done)|bhej diya|transfer kar diya|paise bhej)\b|पैसे भेज|भुगतान कर दिया/i;
const SPOTTED_RE =
  /\b(scam|fraud|fake|phishing|you('?re| are) (not|lying)|real (bank|police) (doesn'?t|never)|this is a scam|thag|dhoka|jhooth)\b|ठग|धोखा|फ़र्ज़ी|फर्जी|झूठ|नकली/i;

export function detectIntent(text: string): Intent {
  if (LEAVE_RE.test(text)) return 'leave';
  if (PAYMENT_COMPLY_RE.test(text)) return 'comply';
  if (REFUSE_RE.test(text)) return 'refuse';
  if (QUESTION_RE.test(text)) return 'question';
  if (COMPLY_RE.test(text) || SECRET_RE.test(text)) return 'comply';
  return 'engaged';
}

/** Local, deterministic tagging. Unioned with the AI's tags so scoring never depends on it. */
export function tagUserTurn(text: string): UserTurnTag[] {
  const tags = new Set<UserTurnTag>();
  const masked = totalMasked(redact(text).counts) > 0;

  if (SPOTTED_RE.test(text)) tags.add('spotted_sign');
  if (VERIFY_RE.test(text)) tags.add('proposed_verification');
  if (LEAVE_RE.test(text)) tags.add('disengaged');
  if (REFUSE_RE.test(text) && !masked) tags.add('refused_info');
  if (masked || SECRET_RE.test(text) || PAYMENT_COMPLY_RE.test(text)) tags.add('shared_info');
  if (tags.size === 0) tags.add('engaged');

  return [...tags];
}

export function compliedWithPayment(userTexts: string[]): boolean {
  return userTexts.some((t) => PAYMENT_COMPLY_RE.test(t));
}

/* ----------------------------------------------------------------- scoring */

export interface ScoreBreakdown {
  spotted: number;
  protected: number;
  verified: number;
  exited: number;
  total: number;
}

export interface ScoreInput {
  /** All tags across the round, AI tags unioned with local tags. */
  tags: UserTurnTag[][];
  /** The user's own messages, used for the privacy-shield check. */
  userTexts: string[];
}

export function scoreSession({ tags, userTexts }: ScoreInput): ScoreBreakdown {
  const flat = tags.flat();

  const spotted = flat.includes('spotted_sign') ? 25 : 0;

  const maskedAnything = userTexts.some((t) => totalMasked(redact(t).counts) > 0);
  const protectedScore = !flat.includes('shared_info') && !maskedAnything ? 25 : 0;

  const verified = flat.includes('proposed_verification') ? 25 : 0;

  let exited = 0;
  const disengagedTurn = tags.findIndex((t) => t.includes('disengaged'));
  if (disengagedTurn !== -1) {
    const turnNumber = disengagedTurn + 1;
    if (turnNumber <= 4) exited = 25;
    else if (turnNumber <= 6) exited = 12;
  }
  if (compliedWithPayment(userTexts)) exited = 0;

  const total = spotted + protectedScore + verified + exited;
  return { spotted, protected: protectedScore, verified, exited, total };
}

export const SCORE_CRITERIA: Array<{ key: keyof ScoreBreakdown; label: Localised }> = [
  {
    key: 'spotted',
    label: { en: 'Spotted the warning signs', hi: 'चेतावनी संकेत पहचाने' },
  },
  {
    key: 'protected',
    label: { en: 'Protected personal information', hi: 'निजी जानकारी बचाई' },
  },
  {
    key: 'verified',
    label: { en: 'Verified independently', hi: 'ख़ुद स्वतंत्र जाँच की' },
  },
  {
    key: 'exited',
    label: { en: 'Exited safely and early', hi: 'सुरक्षित और जल्दी बाहर निकले' },
  },
];

/* -------------------------------------------------------- fallback dialogue */

export interface FallbackState {
  personaId: PersonaId;
  step: number;
}

/** Scripted reply used when Gemini is unavailable or refuses. */
export function fallbackReply(
  personaId: PersonaId,
  stepIndex: number,
  userText: string,
  lang: Lang,
): SparResponse {
  const persona = PERSONAS[personaId];
  const steps = persona.fallback;
  const step = steps[Math.min(stepIndex, steps.length - 1)]!;
  const intent = detectIntent(userText);
  const line = step.replies[intent] ?? step.replies.engaged;

  return {
    reply: line[lang],
    tactics_used: step.tacticsUsed,
    user_turn_tags: tagUserTurn(userText),
    should_end:
      Boolean(step.endsRound) ||
      stepIndex >= steps.length - 1 ||
      intent === 'leave' ||
      (intent === 'comply' && PAYMENT_COMPLY_RE.test(userText)),
    fallback: true,
  };
}

/* -------------------------------------------------------- session reduction */

export interface SparSession {
  personaId: PersonaId;
  lang: Lang;
  messages: SparMessage[];
  tags: UserTurnTag[][];
  tacticsSeen: TacticId[];
  userTurns: number;
  ended: boolean;
  endReason?: 'max_turns' | 'disengaged' | 'high_risk_compliance' | 'script_end';
  usedFallback: boolean;
}

export function startSession(personaId: PersonaId, lang: Lang, openingOverride?: string): SparSession {
  return {
    personaId,
    lang,
    messages: [
      {
        role: 'scammer',
        text: openingOverride ?? PERSONAS[personaId].opening[lang],
      },
    ],
    tags: [],
    tacticsSeen: [...PERSONAS[personaId].tactics.slice(0, 1)],
    userTurns: 0,
    ended: false,
    usedFallback: false,
  };
}

const HIGH_RISK_COMPLY = /\b\d{4,8}\b|\b(aadhaar|aadhar|otp|pin|cvv)\b/i;

/** Apply one user turn plus the scammer's reply. Pure: returns a new session. */
export function applyTurn(
  session: SparSession,
  userText: string,
  response: SparResponse,
): SparSession {
  const tags = Array.from(new Set([...(response.user_turn_tags ?? []), ...tagUserTurn(userText)]));

  const messages: SparMessage[] = [
    ...session.messages,
    { role: 'user', text: userText },
    { role: 'scammer', text: response.reply },
  ];

  const userTurns = session.userTurns + 1;
  const tacticsSeen = Array.from(
    new Set([...session.tacticsSeen, ...(response.tactics_used ?? [])]),
  );

  let ended = false;
  let endReason: SparSession['endReason'];

  if (tags.includes('disengaged')) {
    ended = true;
    endReason = 'disengaged';
  } else if (
    (PAYMENT_COMPLY_RE.test(userText) || HIGH_RISK_COMPLY.test(userText)) &&
    tags.includes('shared_info')
  ) {
    ended = true;
    endReason = 'high_risk_compliance';
  } else if (response.should_end) {
    ended = true;
    endReason = 'script_end';
  } else if (userTurns >= MAX_USER_TURNS) {
    ended = true;
    endReason = 'max_turns';
  }

  return {
    ...session,
    messages,
    tags: [...session.tags, tags],
    tacticsSeen,
    userTurns,
    ended,
    endReason,
    usedFallback: session.usedFallback || Boolean(response.fallback),
  };
}

export const HIGH_RISK_END_LINE: Localised = {
  en: 'This is where real victims lose money.',
  hi: 'असली पीड़ित यहीं पैसे गँवाते हैं।',
};
