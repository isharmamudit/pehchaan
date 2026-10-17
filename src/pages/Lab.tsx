/** Hidden evaluation bench. Not linked from the navigation. */

import { useState } from 'react';
import { Card, Notice, Page, PageTitle, Spinner } from '../components/ui';
import { PillButton } from '../components/Pill';
import { benchCsv, runBench, runRedactionChecks, type LabSummary } from '../core/lab';
import { downloadBlob } from '../lib/image';
import { backendConfigured } from '../lib/api';

export default function Lab() {
  const [summary, setSummary] = useState<LabSummary | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const redaction = runRedactionChecks();
  const live = backendConfigured();

  async function run() {
    setProgress('0 / ?');
    const result = await runBench({
      offline: !live,
      delayMs: live ? 600 : 0,
      onProgress: (done, total) => setProgress(`${done} / ${total}`),
    });
    setSummary(result);
    setProgress(null);
  }

  return (
    <Page>
      <PageTitle sub="Runs the real pipeline over the fixtures, sequentially and rate-limited.">
        Lab
      </PageTitle>

      <Notice tone={live ? 'info' : 'warn'}>
        {live
          ? 'Services are configured: this is a live run.'
          : 'No backend configured: rules and local checks only.'}
      </Notice>

      <div className="mt-6 flex flex-wrap gap-2">
        <PillButton tone="dark" dot onClick={() => void run()}>
          Run all
        </PillButton>
        {summary ? (
          <PillButton
            tone="light"
            onClick={() =>
              downloadBlob(new Blob([benchCsv(summary)], { type: 'text/csv' }), 'bench.csv')
            }
          >
            Export CSV
          </PillButton>
        ) : null}
      </div>

      {progress ? (
        <div className="mt-6">
          <Spinner label={`Running ${progress}`} />
        </div>
      ) : null}

      <Card className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em]">Redaction</h2>
        <p className="text-sm">
          {redaction.passed} / {redaction.total} fixtures pass
        </p>
        {redaction.failures.length ? (
          <ul className="mt-2 space-y-1 text-sm text-[color:var(--danger)]">
            {redaction.failures.map((failure) => (
              <li key={failure}>{failure}</li>
            ))}
          </ul>
        ) : null}
      </Card>

      {summary ? (
        <Card className="mt-6 overflow-x-auto">
          <ul className="mb-5 space-y-1 text-sm">
            <li>
              Scams flagged: {summary.scamsFlagged} / {summary.totalScams}
            </li>
            <li>
              Legit wrongly flagged: {summary.legitWronglyFlagged} / {summary.totalLegit}
            </li>
            <li>
              Redaction passed: {summary.redactionPassed} / {summary.redactionTotal}
            </li>
          </ul>

          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-xs uppercase tracking-[0.12em] text-ink-mute">
                <th className="py-2">id</th>
                <th>expected</th>
                <th>verdict</th>
                <th>score</th>
                <th>findings</th>
                <th>ms</th>
              </tr>
            </thead>
            <tbody>
              {summary.rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--line)]"
                  style={{ color: row.correct ? undefined : 'var(--danger)' }}
                >
                  <td className="py-2">{row.id}</td>
                  <td>{row.expected}</td>
                  <td>{row.verdict}</td>
                  <td className="tabular-nums">{row.score}</td>
                  <td className="tabular-nums">{row.findingCount}</td>
                  <td className="tabular-nums">{row.ms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}
    </Page>
  );
}
