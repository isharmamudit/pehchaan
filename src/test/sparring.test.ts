import { describe, expect, it } from 'vitest';
import {
  applyTurn,
  detectIntent,
  fallbackReply,
  MAX_USER_TURNS,
  scoreSession,
  startSession,
  tagUserTurn,
} from '../core/sparring';
import type { UserTurnTag } from '../core/contracts';

describe('intent detection', () => {
  it('detects leaving', () => {
    expect(detectIntent('I am hanging up now')).toBe('leave');
    expect(detectIntent('Not interested, bye')).toBe('leave');
  });

  it('detects refusal', () => {
    expect(detectIntent('No, I will not share that')).toBe('refuse');
  });

  it('detects questions', () => {
    expect(detectIntent('Which branch are you calling from?')).toBe('question');
  });

  it('detects compliance', () => {
    expect(detectIntent('Ok, the code is 448213')).toBe('comply');
    expect(detectIntent('I have transferred the money')).toBe('comply');
  });
});

describe('turn tagging', () => {
  it('tags spotting a scam', () => {
    expect(tagUserTurn('This is a scam, you are not from the bank')).toContain('spotted_sign');
  });

  it('tags proposing verification', () => {
    expect(tagUserTurn('I will call the official number on my card')).toContain(
      'proposed_verification',
    );
  });

  it('tags sharing information when the shield masks something', () => {
    expect(tagUserTurn('My number is 9876543210')).toContain('shared_info');
  });

  it('tags disengagement', () => {
    expect(tagUserTurn('I am cutting the call')).toContain('disengaged');
  });
});

describe('scoring follows the rubric exactly', () => {
  const t = (...tags: UserTurnTag[]) => tags;

  it('awards a perfect 100 for the ideal round', () => {
    const score = scoreSession({
      tags: [t('spotted_sign'), t('proposed_verification'), t('disengaged')],
      userTexts: ['This looks like a scam', 'I will check with the bank myself', 'Hanging up now'],
    });
    expect(score).toEqual({ spotted: 25, protected: 25, verified: 25, exited: 25, total: 100 });
  });

  it('gives 12 for exiting on turn 5 or 6', () => {
    const tags = [t('engaged'), t('engaged'), t('engaged'), t('engaged'), t('disengaged')];
    const score = scoreSession({
      tags,
      userTexts: ['hello', 'go on', 'and then', 'hmm', 'I am hanging up'],
    });
    expect(score.exited).toBe(12);
  });

  it('gives 0 for exiting after turn 6', () => {
    const tags = [
      t('engaged'), t('engaged'), t('engaged'),
      t('engaged'), t('engaged'), t('engaged'), t('disengaged'),
    ];
    const score = scoreSession({
      tags,
      userTexts: ['a', 'b', 'c', 'd', 'e', 'f', 'I am hanging up'],
    });
    expect(score.exited).toBe(0);
  });

  it('zeroes the exit score after complying with a payment', () => {
    const score = scoreSession({
      tags: [t('disengaged')],
      userTexts: ['I have paid the amount, now I am hanging up'],
    });
    expect(score.exited).toBe(0);
  });

  it('withholds the privacy points if the shield masked anything', () => {
    const score = scoreSession({
      tags: [t('engaged')],
      userTexts: ['My Aadhaar is 2345 6789 0123'],
    });
    expect(score.protected).toBe(0);
  });

  it('withholds the privacy points when the AI tagged shared_info', () => {
    const score = scoreSession({ tags: [t('shared_info')], userTexts: ['here you go'] });
    expect(score.protected).toBe(0);
  });

  it('gives no exit points when the user never leaves', () => {
    const score = scoreSession({ tags: [t('engaged')], userTexts: ['tell me more'] });
    expect(score.exited).toBe(0);
    expect(score.total).toBe(25); // privacy only
  });
});

describe('scripted fallback', () => {
  it('produces a reply for every persona without any network', () => {
    for (const personaId of ['digital_arrest', 'bank_kyc', 'job_task', 'personalised'] as const) {
      const res = fallbackReply(personaId, 0, 'Who is this?', 'en');
      expect(res.reply.length).toBeGreaterThan(0);
      expect(res.fallback).toBe(true);
    }
  });

  it('answers in Hindi when asked', () => {
    const res = fallbackReply('bank_kyc', 0, 'कौन बोल रहा है?', 'hi');
    expect(res.reply).toMatch(/[ऀ-ॿ]/);
  });

  it('ends the round when the user leaves', () => {
    expect(fallbackReply('bank_kyc', 0, 'I am hanging up', 'en').should_end).toBe(true);
  });

  it('never runs out of steps', () => {
    const res = fallbackReply('bank_kyc', 99, 'ok', 'en');
    expect(res.reply.length).toBeGreaterThan(0);
  });
});

describe('session flow', () => {
  it('ends after the maximum number of user turns', () => {
    let session = startSession('job_task', 'en');
    for (let i = 0; i < MAX_USER_TURNS; i++) {
      const reply = {
        reply: 'keep going',
        tactics_used: [],
        user_turn_tags: ['engaged' as const],
        should_end: false,
      };
      session = applyTurn(session, 'tell me more', reply);
    }
    expect(session.ended).toBe(true);
    expect(session.endReason).toBe('max_turns');
  });

  it('ends early when the user shares a code', () => {
    let session = startSession('bank_kyc', 'en');
    session = applyTurn(session, 'The code is 448213', {
      reply: 'Thank you',
      tactics_used: [],
      user_turn_tags: [],
      should_end: false,
    });
    expect(session.ended).toBe(true);
    expect(session.endReason).toBe('high_risk_compliance');
  });

  it('ends when the user disengages', () => {
    let session = startSession('digital_arrest', 'en');
    session = applyTurn(session, 'I am hanging up and calling 1930', {
      reply: '...',
      tactics_used: [],
      user_turn_tags: [],
      should_end: false,
    });
    expect(session.endReason).toBe('disengaged');
  });
});

describe('static debrief', () => {
  it('quotes a scammer line that actually shows the tactic', async () => {
    const { staticDebrief } = await import('../core/debrief');

    const history = [
      { role: 'scammer' as const, text: 'Your account will be blocked within 24 hours.' },
      { role: 'user' as const, text: 'Who is this?' },
      { role: 'scammer' as const, text: 'Please install AnyDesk so I can guide your screen.' },
    ];

    const debrief = staticDebrief('bank_kyc', 'en', history);
    const remote = debrief.tactics_seen.find((t) => t.tactic === 'remote_access');
    const threat = debrief.tactics_seen.find((t) => t.tactic === 'threat_fear');

    expect(remote?.quote).toContain('AnyDesk');
    expect(threat?.quote).toContain('blocked');
  }, 15000);

  it('still returns a debrief when the transcript is empty of rule hits', async () => {
    const { staticDebrief } = await import('../core/debrief');
    const debrief = staticDebrief('job_task', 'en', [
      { role: 'scammer', text: 'Hello there.' },
    ]);
    expect(debrief.tactics_seen.length).toBeGreaterThan(0);
    expect(debrief.did_well.length).toBeGreaterThan(0);
  }, 15000);
});
