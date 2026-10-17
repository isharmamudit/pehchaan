/**
 * Evaluation bench (/lab). Runs the real pipeline over the fixtures,
 * sequentially and rate-limited, and reports honest numbers.
 */

import messages from '../test/fixtures/messages.json';
import claimFixtures from '../test/fixtures/claims.json';
import redactionFixtures from '../test/fixtures/redaction.json';
import { analyzeInput } from './pipeline';
import { redact } from './redact';
import type { Lang } from './tactics';
import type { ClaimLabel, Verdict } from './types';

export interface MessageFixture {
  id: string;
  text: string;
  expected: 'scam' | 'legit';
  language: string;
  source: 'real_redacted' | 'team_written';
  tactics?: string[];
}

export interface ClaimFixture {
  id: string;
  text: string;
  expectedLabel: ClaimLabel;
  topic: string;
}

export interface RedactionFixture {
  id: string;
  input: string;
  mustMask: string[];
  mustKeep: string[];
}

export const MESSAGE_FIXTURES = messages as MessageFixture[];
export const CLAIM_FIXTURES = claimFixtures as ClaimFixture[];
export const REDACTION_FIXTURES = redactionFixtures as RedactionFixture[];

export interface LabRow {
  id: string;
  expected: 'scam' | 'legit';
  verdict: Verdict;
  score: number;
  flagged: boolean;
  correct: boolean;
  findingCount: number;
  ruleCount: number;
  unavailable: string[];
  ms: number;
}

export interface LabSummary {
  scamsFlagged: number;
  totalScams: number;
  legitWronglyFlagged: number;
  totalLegit: number;
  redactionPassed: number;
  redactionTotal: number;
  rows: LabRow[];
}

/** A scam counts as caught when the verdict is likely_scam or suspicious. */
export function isFlagged(verdict: Verdict): boolean {
  return verdict === 'likely_scam' || verdict === 'suspicious';
}

export function runRedactionChecks(): { passed: number; total: number; failures: string[] } {
  const failures: string[] = [];
  for (const f of REDACTION_FIXTURES) {
    const { redacted } = redact(f.input);
    const leaked = f.mustMask.filter((v) => redacted.includes(v));
    const lost = f.mustKeep.filter((v) => !redacted.includes(v));
    if (leaked.length || lost.length) {
      failures.push(
        `${f.id}: ${leaked.length ? `leaked ${leaked.join(', ')}` : ''}${
          lost.length ? ` lost ${lost.join(', ')}` : ''
        }`.trim(),
      );
    }
  }
  return {
    passed: REDACTION_FIXTURES.length - failures.length,
    total: REDACTION_FIXTURES.length,
    failures,
  };
}

export interface RunOptions {
  lang?: Lang;
  /** Pause between items so the rate limits are not tripped. */
  delayMs?: number;
  offline?: boolean;
  onProgress?: (done: number, total: number) => void;
}

export async function runBench(options: RunOptions = {}): Promise<LabSummary> {
  const { lang = 'en', delayMs = 400, offline = false, onProgress } = options;
  const rows: LabRow[] = [];

  for (const [i, fixture] of MESSAGE_FIXTURES.entries()) {
    const started = Date.now();
    const result = await analyzeInput({
      text: fixture.text,
      inputType: 'message',
      lang,
      offline,
    });
    const flagged = isFlagged(result.verdict);
    rows.push({
      id: fixture.id,
      expected: fixture.expected,
      verdict: result.verdict,
      score: result.score,
      flagged,
      correct: fixture.expected === 'scam' ? flagged : !flagged,
      findingCount: result.findings.length,
      ruleCount: result.findings.filter((f) => f.evidence === 'rule').length,
      unavailable: result.unavailable,
      ms: Date.now() - started,
    });
    onProgress?.(i + 1, MESSAGE_FIXTURES.length);
    if (delayMs && i < MESSAGE_FIXTURES.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  const redaction = runRedactionChecks();
  const scams = rows.filter((r) => r.expected === 'scam');
  const legit = rows.filter((r) => r.expected === 'legit');

  return {
    scamsFlagged: scams.filter((r) => r.flagged).length,
    totalScams: scams.length,
    legitWronglyFlagged: legit.filter((r) => r.flagged).length,
    totalLegit: legit.length,
    redactionPassed: redaction.passed,
    redactionTotal: redaction.total,
    rows,
  };
}

export function benchCsv(summary: LabSummary): string {
  const header = 'id,expected,verdict,score,flagged,correct,findings,rule_findings,unavailable,ms';
  const lines = summary.rows.map((r) =>
    [
      r.id,
      r.expected,
      r.verdict,
      r.score,
      r.flagged,
      r.correct,
      r.findingCount,
      r.ruleCount,
      `"${r.unavailable.join(' ')}"`,
      r.ms,
    ].join(','),
  );
  return [header, ...lines].join('\n');
}
