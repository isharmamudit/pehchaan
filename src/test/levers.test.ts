import { describe, expect, it } from 'vitest';
import {
  didFold,
  emptyProfile,
  LEVERS,
  leversUsed,
  profileSentence,
  recordRound,
  resistance,
  strongestLever,
  TACTIC_LEVER,
  weakestLever,
} from '../core/levers';
import { personaForLever, personaLevers } from '../core/personas';
import { TACTIC_IDS } from '../core/tactics';
import type { UserTurnTag } from '../core/contracts';

describe('lever mapping', () => {
  it('maps every tactic to a lever', () => {
    for (const tactic of TACTIC_IDS) {
      expect(LEVERS).toContain(TACTIC_LEVER[tactic]);
    }
  });

  it('collapses tactics into the levers they push', () => {
    expect(leversUsed(['threat_fear', 'secrecy_isolation'])).toEqual(['fear']);
    expect(leversUsed(['fake_authority', 'false_urgency']).sort()).toEqual([
      'authority',
      'urgency',
    ]);
    expect(leversUsed([])).toEqual([]);
  });
});

describe('folding', () => {
  const t = (...tags: UserTurnTag[]) => tags;

  it('counts sharing information as folding', () => {
    expect(didFold([t('engaged'), t('shared_info')])).toBe(true);
  });

  it('does not count questioning, refusing or leaving as folding', () => {
    expect(didFold([t('spotted_sign'), t('refused_info'), t('disengaged')])).toBe(false);
  });
});

describe('profile', () => {
  const t = (...tags: UserTurnTag[]) => tags;

  it('starts empty and reports no weak spot', () => {
    const profile = emptyProfile();
    expect(weakestLever(profile)).toBeNull();
    expect(profileSentence(profile, 'en')).toBeNull();
  });

  it('records which levers were faced and whether they worked', () => {
    let profile = emptyProfile();
    profile = recordRound(profile, ['fake_authority', 'threat_fear'], [t('shared_info')]);

    expect(profile.authority).toEqual({ faced: 1, folded: 1 });
    expect(profile.fear).toEqual({ faced: 1, folded: 1 });
    expect(profile.greed).toEqual({ faced: 0, folded: 0 });
  });

  it('does not count a round the person held out in', () => {
    let profile = emptyProfile();
    profile = recordRound(profile, ['too_good_to_be_true'], [t('refused_info'), t('disengaged')]);
    expect(profile.greed).toEqual({ faced: 1, folded: 0 });
    expect(resistance(profile.greed)).toBe(1);
  });

  it('finds the lever the person actually folds under', () => {
    let profile = emptyProfile();
    // Resists greed twice.
    profile = recordRound(profile, ['too_good_to_be_true'], [t('refused_info')]);
    profile = recordRound(profile, ['payment_request'], [t('disengaged')]);
    // Folds to authority twice.
    profile = recordRound(profile, ['fake_authority'], [t('shared_info')]);
    profile = recordRound(profile, ['fake_authority'], [t('shared_info')]);

    expect(weakestLever(profile)).toBe('authority');
    expect(strongestLever(profile)).toBe('greed');
    expect(profileSentence(profile, 'en')).toBe('You resist greed, but you fold under authority.');
    expect(profileSentence(profile, 'hi')).toMatch(/[ऀ-ॿ]/);
  });

  it('suggests the least-practised lever when nothing has been given up', () => {
    let profile = emptyProfile();
    profile = recordRound(profile, ['fake_authority'], [t('refused_info')]);
    profile = recordRound(profile, ['fake_authority'], [t('refused_info')]);
    profile = recordRound(profile, ['threat_fear'], [t('refused_info')]);

    expect(weakestLever(profile)).toBe('fear');
    expect(profileSentence(profile, 'en')).toContain('held firm');
  });

  it('ignores a lever that has never been faced', () => {
    let profile = emptyProfile();
    profile = recordRound(profile, ['fake_authority'], [t('shared_info')]);
    expect(resistance(profile.trust)).toBeNull();
    expect(weakestLever(profile)).toBe('authority');
  });
});

describe('adaptive persona choice', () => {
  it('picks a persona that actually pushes the target lever', () => {
    for (const lever of LEVERS) {
      const persona = personaForLever(lever);
      expect(personaLevers(persona)).toContain(lever);
    }
  });

  it('sends an authority weak spot to the digital arrest persona', () => {
    expect(personaForLever('authority')).toBe('digital_arrest');
  });
});
