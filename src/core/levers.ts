/**
 * Pressure levers: the psychological button a tactic pushes.
 *
 * Nine tactics collapse into five levers. Tracking which lever a person
 * actually folds under turns Sparring from a quiz into targeted training:
 * the next simulated scammer leans on their weakest lever.
 *
 * Pure logic, no storage and no DOM, so it is unit-tested directly.
 */

import type { Localised, TacticId } from './tactics';
import type { UserTurnTag } from './contracts';

export type Lever = 'fear' | 'authority' | 'greed' | 'urgency' | 'trust';

export const LEVERS: Lever[] = ['fear', 'authority', 'greed', 'urgency', 'trust'];

export const TACTIC_LEVER: Record<TacticId, Lever> = {
  threat_fear: 'fear',
  secrecy_isolation: 'fear',
  fake_authority: 'authority',
  false_urgency: 'urgency',
  too_good_to_be_true: 'greed',
  payment_request: 'greed',
  credential_request: 'trust',
  remote_access: 'trust',
  suspicious_link: 'trust',
};

const L = (en: string, hi: string): Localised => ({ en, hi });

export const LEVER_NAME: Record<Lever, Localised> = {
  fear: L('Fear', 'डर'),
  authority: L('Authority', 'रौब'),
  greed: L('Greed', 'लालच'),
  urgency: L('Urgency', 'जल्दबाज़ी'),
  trust: L('Trust', 'भरोसा'),
};

export const LEVER_LINE: Record<Lever, Localised> = {
  fear: L(
    'Threats of arrest, loss or shame, and being kept away from anyone who would warn you.',
    'गिरफ़्तारी, नुकसान या बदनामी का डर, और ऐसे लोगों से दूर रखना जो आपको चेता सकें।',
  ),
  authority: L(
    'Someone borrowing the weight of the police, a bank or a government office.',
    'कोई पुलिस, बैंक या सरकारी दफ़्तर का रौब उधार लेकर बात करता है।',
  ),
  greed: L(
    'Easy money, prizes, refunds, and fees you pay to unlock something bigger.',
    'आसान कमाई, इनाम, रिफ़ंड, और कुछ बड़ा पाने के लिए भरी जाने वाली फ़ीस।',
  ),
  urgency: L(
    'An invented deadline, so you act before you can check anything.',
    'नकली समय-सीमा, ताकि जाँचने से पहले ही आप कर बैठें।',
  ),
  trust: L(
    'Being talked into handing over a code, a screen, or a tap on a link.',
    'बातों में लेकर कोड, स्क्रीन या लिंक पर टैप करवा लेना।',
  ),
};

/* --------------------------------------------------------------- profile */

export interface LeverRecord {
  /** Rounds in which this lever was used against the person. */
  faced: number;
  /** Rounds in which they gave something up while it was being used. */
  folded: number;
}

export type PressureProfile = Record<Lever, LeverRecord>;

export function emptyProfile(): PressureProfile {
  return {
    fear: { faced: 0, folded: 0 },
    authority: { faced: 0, folded: 0 },
    greed: { faced: 0, folded: 0 },
    urgency: { faced: 0, folded: 0 },
    trust: { faced: 0, folded: 0 },
  };
}

/** Which levers were pushed in a round, from the tactics the scammer used. */
export function leversUsed(tactics: TacticId[]): Lever[] {
  return [...new Set(tactics.map((tactic) => TACTIC_LEVER[tactic]))];
}

/**
 * Did the person give something up this round?
 * Sharing information or complying with a payment counts; questioning,
 * refusing, verifying and leaving do not.
 */
export function didFold(tags: UserTurnTag[][]): boolean {
  return tags.flat().includes('shared_info');
}

export function recordRound(
  profile: PressureProfile,
  tactics: TacticId[],
  tags: UserTurnTag[][],
): PressureProfile {
  const next: PressureProfile = {
    fear: { ...profile.fear },
    authority: { ...profile.authority },
    greed: { ...profile.greed },
    urgency: { ...profile.urgency },
    trust: { ...profile.trust },
  };

  const folded = didFold(tags);
  for (const lever of leversUsed(tactics)) {
    next[lever].faced += 1;
    if (folded) next[lever].folded += 1;
  }

  return next;
}

/** 0 = folds every time, 1 = never folds. Null when never faced. */
export function resistance(record: LeverRecord): number | null {
  if (record.faced === 0) return null;
  return 1 - record.folded / record.faced;
}

/**
 * The lever to target next: the weakest one they have actually met.
 * With nothing to go on, the least-practised lever is returned instead, so a
 * new user still gets variety rather than the same persona every time.
 */
export function weakestLever(profile: PressureProfile): Lever | null {
  const faced = LEVERS.filter((lever) => profile[lever].faced > 0);

  if (!faced.length) return null;

  const withScore = faced.map((lever) => ({
    lever,
    score: resistance(profile[lever]) ?? 1,
    faced: profile[lever].faced,
  }));

  withScore.sort((a, b) => a.score - b.score || b.faced - a.faced);
  const weakest = withScore[0]!;

  // Everyone resisted everything so far: practise the least-tested lever.
  if (weakest.score === 1) {
    const leastTested = [...faced].sort(
      (a, b) => profile[a].faced - profile[b].faced,
    )[0]!;
    return leastTested;
  }

  return weakest.lever;
}

export function strongestLever(profile: PressureProfile): Lever | null {
  const faced = LEVERS.filter((lever) => profile[lever].faced > 0);
  if (!faced.length) return null;
  return faced
    .map((lever) => ({ lever, score: resistance(profile[lever]) ?? 0 }))
    .sort((a, b) => b.score - a.score)[0]!.lever;
}

/** "You resist greed but fold under authority." */
export function profileSentence(profile: PressureProfile, lang: 'en' | 'hi'): string | null {
  const weak = weakestLever(profile);
  const strong = strongestLever(profile);
  if (!weak) return null;

  const weakName = LEVER_NAME[weak][lang].toLowerCase();
  const weakResistance = resistance(profile[weak]) ?? 1;

  // Nothing given up yet: say so, and point at the least-practised lever.
  if (weakResistance === 1) {
    return lang === 'hi'
      ? `आपने अब तक हर दबाव झेला है। अगला अभ्यास ${LEVER_NAME[weak][lang]} पर।`
      : `You have held firm against every lever so far. Next up: ${weakName}.`;
  }

  if (!strong || strong === weak) {
    return lang === 'hi'
      ? `अभी तक ${LEVER_NAME[weak][lang]} आपकी सबसे कमज़ोर कड़ी है।`
      : `So far, ${weakName} is where you are most likely to give something up.`;
  }

  const strongName = LEVER_NAME[strong][lang].toLowerCase();

  return lang === 'hi'
    ? `आप ${LEVER_NAME[strong][lang]} के आगे टिकते हैं, पर ${LEVER_NAME[weak][lang]} के आगे झुक जाते हैं।`
    : `You resist ${strongName}, but you fold under ${weakName}.`;
}
