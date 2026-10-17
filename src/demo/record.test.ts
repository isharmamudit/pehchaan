/**
 * Demo cache recorder. Not a test: it is gated behind RECORD_DEMO=1 and runs
 * through Vitest only because that is the project's TypeScript runner.
 *
 *   npm run record-demo            # records with whatever keys are configured
 *
 * With keys present it records live results; without them it records the
 * rules-only result and marks the file "offline_rules_only". It never invents output.
 */

import { describe, it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeInput } from '../core/pipeline';
import { backendConfigured } from '../lib/api';
import { DEMO_INPUTS } from './inputs';

const enabled = process.env.RECORD_DEMO === '1';
const here = dirname(fileURLToPath(import.meta.url));

describe.skipIf(!enabled)('record demo cache', () => {
  it('records every Check demo input', async () => {
    const live = backendConfigured();
    const dir = resolve(here, 'cache');
    mkdirSync(dir, { recursive: true });

    for (const input of DEMO_INPUTS.filter((d) => d.route === '/check')) {
      const result = await analyzeInput({
        text: input.text,
        inputType: input.inputType,
        lang: 'en',
        offline: !live,
        upiPayQr: input.inputType === 'qr',
      });

      const payload = {
        id: input.id,
        recordedAt: new Date().toISOString(),
        source: live ? 'live' : 'offline_rules_only',
        result: { ...result, cached: true },
      };

      writeFileSync(resolve(dir, `${input.id}.json`), `${JSON.stringify(payload, null, 2)}\n`);
      // eslint-disable-next-line no-console
      console.log(`recorded ${input.id}: ${result.verdict} (${result.findings.length} findings)`);
    }
  }, 120000);
});
