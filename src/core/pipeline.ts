/**
 * The Check pipeline.
 *
 *   rules (local, original text)
 *   → URLs → check-urls          ┐ in parallel
 *   → redact → analyze (Gemini)  ┘
 *   → verify AI quotes, merge, badge, verdict in code
 *   → claims → fact-check → labels in code
 *
 * Evidence badges are assigned here, by origin. The AI never sets one.
 */

import { callFunction } from '../lib/api';
import { labelClaim } from './claims';
import { runHoaxTemplates } from './hoaxTemplates';
import { dedupeFindings, runRules } from './rules';
import { redact } from './redact';
import { extractUrls, hostOf } from './urls';
import { findQuote } from './verify';
import { computeVerdict } from './verdict';
import type { Lang, TacticId } from './tactics';
import type {
  AnalysisResult,
  Claim,
  Finding,
  InputType,
  ServiceName,
  UrlResult,
} from './types';
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  CheckUrlsResponse,
  FactCheckResponse,
} from './contracts';
import { isTacticId } from './tactics';

export interface PipelineInput {
  text: string;
  inputType: InputType;
  lang: Lang;
  /** Set when the input came from a decoded upi://pay QR code. */
  upiPayQr?: boolean;
  /** Extra findings produced by the caller (QR parsing, metadata). */
  extraFindings?: Finding[];
  /** Skip network calls entirely (used by tests and offline demo). */
  offline?: boolean;
}

export const MAX_TEXT_LENGTH = 5000;
export const MAX_URLS = 10;

const AI_TIMEOUT_MS = 10000;
const URL_TIMEOUT_MS = 12000;
const FACTCHECK_TIMEOUT_MS = 14000;

/** Claim mode is on when the input looks like a forward or the AI found claims. */
export function isClaimMode(inputType: InputType, claims: Claim[]): boolean {
  return inputType === 'claim_forward' || claims.length > 0;
}

function serviceFindingsFromUrls(urls: UrlResult[], lang: Lang): Finding[] {
  const findings: Finding[] = [];
  urls.forEach((u, i) => {
    const parts: string[] = [];
    let weight = 0;

    if (u.safeBrowsing === 'match') {
      weight = Math.max(weight, 3);
      parts.push(
        lang === 'hi'
          ? 'यह लिंक गूगल की ख़तरनाक साइटों की सूची में है।'
          : 'This link is on Google Safe Browsing’s list of dangerous sites.',
      );
    }
    if (u.lookalike.flag) {
      weight = Math.max(weight, 3);
      const brand = u.lookalike.matchedBrand ?? '';
      parts.push(
        lang === 'hi'
          ? `यह पता ${brand || 'किसी असली संस्था'} की नक़ल करता है, पर उसकी आधिकारिक साइट नहीं है।`
          : `This address imitates ${brand || 'a real organisation'} but is not its official site.`,
      );
    }
    if (u.isShortener) {
      weight = Math.max(weight, 1);
      parts.push(
        lang === 'hi'
          ? `छोटा किया गया लिंक असली पता छिपाता है; यह ${hostOf(u.final) || u.final} पर जाता है।`
          : `A shortened link hides where it goes; this one lands on ${hostOf(u.final) || u.final}.`,
      );
    }

    if (!parts.length) return;
    findings.push({
      id: `url_${i}`,
      tactic: 'suspicious_link' as TacticId,
      matchedText: u.original,
      start: -1,
      end: -1,
      evidence: 'service',
      explanation: parts.join(' '),
      weight,
    });
  });
  return findings;
}

/** Map AI quotes back to the original text; drop anything not actually present. */
export function verifyAiFindings(
  original: string,
  aiFindings: AnalyzeResponse['findings'],
  map: Record<string, string>,
): Finding[] {
  if (!aiFindings?.length) return [];
  const out: Finding[] = [];

  aiFindings.forEach((f, i) => {
    if (!f || typeof f.text !== 'string' || !isTacticId(f.tactic)) return;

    // The AI sees tokens; restore them before looking for the quote.
    let quote = f.text;
    for (const [token, value] of Object.entries(map)) {
      quote = quote.split(token).join(value);
    }

    const span = findQuote(original, quote);
    if (!span) return; // AI invented it — drop it.

    out.push({
      id: `ai_${i}`,
      tactic: f.tactic,
      matchedText: original.slice(span.start, span.end),
      start: span.start,
      end: span.end,
      evidence: 'ai',
      explanation: String(f.explanation ?? '').slice(0, 240),
      weight: 1,
    });
  });

  return out;
}

/** Rule findings win on overlap; a useful AI sentence rides along with them. */
export function mergeFindings(ruleFindings: Finding[], aiFindings: Finding[]): Finding[] {
  const merged = [...ruleFindings];

  for (const ai of aiFindings) {
    const overlapping = merged.find(
      (r) => r.start >= 0 && ai.start < r.end && ai.end > r.start,
    );
    if (overlapping) {
      if (!overlapping.aiExplanation && overlapping.explanation !== ai.explanation) {
        overlapping.aiExplanation = ai.explanation;
      }
      continue;
    }
    merged.push(ai);
  }

  return dedupeFindings(merged).sort((a, b) => {
    if (a.start < 0 && b.start < 0) return 0;
    if (a.start < 0) return 1;
    if (b.start < 0) return -1;
    return a.start - b.start;
  });
}

/**
 * Everything that is about to leave the browser for the analyze call.
 * Exported so a test can assert that nothing unredacted is in it.
 */
export function buildAnalyzeRequest(
  redactedText: string,
  lang: Lang,
  inputType: InputType,
  ruleFindings: Finding[],
): AnalyzeRequest {
  return {
    text: redactedText,
    language: lang,
    inputType,
    ruleFindings: ruleFindings
      .filter((f) => f.start >= 0)
      .map((f) => ({ tactic: f.tactic, text: redact(f.matchedText).redacted })),
  };
}

export async function analyzeInput(input: PipelineInput): Promise<AnalysisResult> {
  const text = input.text.slice(0, MAX_TEXT_LENGTH);
  const lang = input.lang;
  const unavailable: ServiceName[] = [];

  // 1. Rules run locally on the ORIGINAL text.
  const ruleFindings = [
    ...runRules(text, { lang }),
    ...runHoaxTemplates(text, lang),
    ...(input.extraFindings ?? []),
  ];

  // 2. URLs.
  const extracted = extractUrls(text).slice(0, MAX_URLS);
  const urlPromise: Promise<UrlResult[]> =
    extracted.length && !input.offline
      ? callFunction<CheckUrlsResponse>(
          'check-urls',
          { urls: extracted.map((u) => u.url) },
          { timeoutMs: URL_TIMEOUT_MS },
        ).then((res) => {
          if (!res.ok) {
            unavailable.push('link_checker');
            return [];
          }
          return res.data.results ?? [];
        })
      : Promise.resolve([]);

  // 3. Privacy shield.
  const { redacted, map, counts } = redact(text);

  // 4. AI, with the rule hits (matched text redacted too).
  const aiRequest = buildAnalyzeRequest(redacted, lang, input.inputType, ruleFindings);

  const aiPromise: Promise<AnalyzeResponse | null> = input.offline
    ? Promise.resolve(null)
    : callFunction<AnalyzeResponse>('analyze', aiRequest, { timeoutMs: AI_TIMEOUT_MS }).then(
        (res) => (res.ok ? res.data : null),
      );

  const [urls, ai] = await Promise.all([urlPromise, aiPromise]);

  if (!ai || ai.ai_unavailable) {
    if (!input.offline) unavailable.push('ai');
  }

  // 5. Post-processing, all in code.
  const aiFindings = verifyAiFindings(text, ai?.findings, map);
  const findings = mergeFindings(
    [...ruleFindings, ...serviceFindingsFromUrls(urls, lang)],
    aiFindings,
  );

  // 6. Claims.
  const claims = await resolveClaims(ai, lang, input.offline ?? false, unavailable);

  const { verdict, score } = computeVerdict({
    findings,
    urls,
    upiPayQr: input.upiPayQr,
  });

  return {
    verdict,
    score,
    inputType: input.inputType,
    language: lang,
    text,
    findings,
    claims,
    urls,
    summary: ai?.summary,
    redactionCounts: counts,
    unavailable,
  };
}

async function resolveClaims(
  ai: AnalyzeResponse | null,
  lang: Lang,
  offline: boolean,
  unavailable: ServiceName[],
): Promise<Claim[]> {
  const raw = ai?.claims ?? [];
  if (!raw.length) return [];

  const claims: Claim[] = raw.slice(0, 8).map((c, i) => ({
    id: `claim_${i}`,
    text: String(c.text ?? ''),
    kind:
      c.kind === 'opinion' || c.kind === 'bait' || c.kind === 'unverifiable'
        ? c.kind
        : 'checkable',
    topic: c.topic ?? 'other',
    searchQuery: String(c.search_query ?? c.text ?? '').slice(0, 200),
    label: 'not_verified',
    matches: [],
    evidence: 'ai',
  }));

  // Only genuinely checkable claims are worth a fact-check lookup.
  const checkable = claims.filter((c) => c.kind === 'checkable' && c.searchQuery);
  if (checkable.length && !offline) {
    const res = await callFunction<FactCheckResponse>(
      'fact-check',
      {
        claims: checkable.map((c) => ({
          id: c.id,
          query: c.searchQuery,
          languageCodes: lang === 'hi' ? ['en', 'hi'] : ['en'],
        })),
        ground: true,
      },
      { timeoutMs: FACTCHECK_TIMEOUT_MS },
    );

    if (!res.ok || res.data.unavailable) {
      unavailable.push('fact_check');
    } else {
      for (const r of res.data.results ?? []) {
        const claim = claims.find((c) => c.id === r.id);
        if (!claim) continue;
        claim.matches = r.matches ?? [];
        if (r.sources?.length) claim.sources = r.sources;
      }
    }
  }

  for (const claim of claims) {
    const { label, evidence } = labelClaim(claim.kind, claim.matches);
    claim.label = label;
    claim.evidence = evidence;
  }

  return claims;
}
