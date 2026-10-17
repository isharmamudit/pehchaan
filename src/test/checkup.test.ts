import { describe, expect, it } from 'vitest';
import { CHECKUP_QUESTIONS, MAX_RAW_SCORE, scoreCheckup } from '../core/checkup';
import { gradeQuiz, QUIZ_ITEMS, quizSet } from '../data/quiz';
import { SITUATIONS, HELP_FOOTER } from '../config/help';

describe('privacy check-up', () => {
  it('has 12 questions, two per area', () => {
    expect(CHECKUP_QUESTIONS).toHaveLength(12);
    const areas = new Map<string, number>();
    for (const q of CHECKUP_QUESTIONS) areas.set(q.area, (areas.get(q.area) ?? 0) + 1);
    expect([...areas.values()].every((n) => n === 2)).toBe(true);
    expect(areas.size).toBe(6);
  });

  it('scores every option 0, 4 or 8', () => {
    for (const q of CHECKUP_QUESTIONS) {
      expect(q.options).toHaveLength(3);
      for (const o of q.options) expect([0, 4, 8]).toContain(o.score);
    }
  });

  it('scales the best possible answers to 100', () => {
    const answers = CHECKUP_QUESTIONS.map((q) => ({
      questionId: q.id,
      optionIndex: q.options.findIndex((o) => o.score === 8) as 0 | 1 | 2,
    }));
    const result = scoreCheckup(answers);
    expect(result.raw).toBe(MAX_RAW_SCORE);
    expect(result.score).toBe(100);
    expect(result.checklist).toHaveLength(0);
  });

  it('puts the worst answers at the top of the checklist', () => {
    const answers = CHECKUP_QUESTIONS.map((q, i) => ({
      questionId: q.id,
      optionIndex: (i === 0 ? 0 : 2) as 0 | 1 | 2,
    }));
    const result = scoreCheckup(answers);
    expect(result.score).toBeLessThan(100);
    expect(result.checklist[0]?.area).toBe(CHECKUP_QUESTIONS[0]!.area);
    expect(result.checklist[0]?.steps.length).toBeGreaterThanOrEqual(3);
  });
});

describe('spot-the-scam quiz', () => {
  it('has two sets of five, each mixing scams and genuine messages', () => {
    for (const set of ['a', 'b'] as const) {
      const items = quizSet(set);
      expect(items).toHaveLength(5);
      expect(items.some((i) => i.answer === 'scam')).toBe(true);
      expect(items.some((i) => i.answer === 'legit')).toBe(true);
    }
    expect(QUIZ_ITEMS).toHaveLength(10);
  });

  it('grades answers and treats "not sure" as wrong', () => {
    const items = quizSet('a');
    const answers = Object.fromEntries(items.map((i) => [i.id, i.answer]));
    expect(gradeQuiz('a', answers).correct).toBe(5);
    expect(gradeQuiz('a', {}).correct).toBe(0);
  });

  it('explains every item in both languages', () => {
    for (const item of QUIZ_ITEMS) {
      expect(item.explanation.en.length).toBeGreaterThan(20);
      expect(item.explanation.hi).toMatch(/[ऀ-ॿ]/);
    }
  });
});

describe('get help now', () => {
  it('covers all five situations with steps in both languages', () => {
    expect(SITUATIONS).toHaveLength(5);
    for (const s of SITUATIONS) {
      expect(s.steps.length).toBeGreaterThanOrEqual(3);
      for (const step of s.steps) {
        expect(step.text.en.length).toBeGreaterThan(10);
        expect(step.text.hi).toMatch(/[ऀ-ॿ]/);
      }
    }
  });

  it('includes the 1930 helpline as a tel: link', () => {
    const money = SITUATIONS.find((s) => s.id === 'money_lost')!;
    expect(money.steps.some((s) => s.tel === 'tel:1930')).toBe(true);
  });

  it('states plainly what the app cannot do', () => {
    expect(HELP_FOOTER.en).toMatch(/cannot freeze accounts or recover money/);
  });
});
