/**
 * Live evaluation bench. Gated behind RUN_BENCH=1 so it never runs in CI.
 *
 *   npm run bench          # offline, rules only
 *   RUN_BENCH=1 ...        # see package.json; add keys in .env.local for a live run
 *
 * Prints the same numbers the /lab screen will show, and writes a CSV.
 */

import { describe, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { benchCsv, runBench } from '../core/lab';
import { backendConfigured } from '../lib/api';

const enabled = process.env.RUN_BENCH === '1';

describe.skipIf(!enabled)('evaluation bench', () => {
  it('runs every fixture through the real pipeline', async () => {
    const live = backendConfigured();
    const summary = await runBench({ offline: !live, delayMs: live ? 600 : 0 });

    /* eslint-disable no-console */
    console.log(`\nmode: ${live ? 'LIVE (services configured)' : 'OFFLINE (rules only)'}`);
    console.log(`scams flagged:        ${summary.scamsFlagged}/${summary.totalScams}`);
    console.log(`legit wrongly flagged: ${summary.legitWronglyFlagged}/${summary.totalLegit}`);
    console.log(`redaction passed:      ${summary.redactionPassed}/${summary.redactionTotal}`);
    for (const row of summary.rows) {
      const mark = row.correct ? 'ok  ' : 'MISS';
      console.log(
        `  ${mark} ${row.id.padEnd(24)} ${row.verdict.padEnd(13)} score ${String(row.score).padStart(2)}  ${row.ms}ms` +
          (row.unavailable.length ? `  unavailable: ${row.unavailable.join(',')}` : ''),
      );
    }

    const out = resolve(process.cwd(), 'bench-results.csv');
    writeFileSync(out, `${benchCsv(summary)}\n`);
    console.log(`\nCSV written to ${out}`);
    /* eslint-enable no-console */
  }, 300000);
});
