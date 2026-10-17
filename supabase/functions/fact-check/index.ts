/**
 * fact-check — Google Fact Check Tools API. Returns publisher-cited reviews only.
 * The true/false label is decided in the browser from the publisher's own rating,
 * never by this function and never by the AI.
 */

import { clientIp, json, serveFunction } from '../_shared/http.ts';
import { rateLimit } from '../_shared/rateLimit.ts';
import { arr, LIMITS, readJson, ValidationError } from '../_shared/validate.ts';
import { generateGrounded, geminiConfigured } from '../_shared/gemini.ts';
import { GROUNDED_SYSTEM_PROMPT, groundedUserPrompt } from '../_shared/prompts.ts';

const ENDPOINT = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';
const TIMEOUT_MS = 5000;
const MAX_MATCHES = 3;

interface Match {
  publisher: string;
  title: string;
  url: string;
  textualRating: string;
  reviewDate?: string;
}

export interface GroundedSource {
  title: string;
  url: string;
}

/**
 * P1: for a claim no fact-checker has covered, ask Gemini with the Google
 * Search tool and return ONLY the links that come back in grounding metadata.
 * Anything the model writes without a grounded link is discarded.
 */
async function groundedSources(claim: string): Promise<GroundedSource[]> {
  if (!geminiConfigured()) return [];

  const res = await generateGrounded({
    system: GROUNDED_SYSTEM_PROMPT,
    user: groundedUserPrompt(claim),
    temperature: 0.1,
    maxOutputTokens: 512,
    timeoutMs: 8000,
  });
  if (!res.ok) return [];

  const meta = res.data.groundingMetadata as
    | { groundingChunks?: Array<{ web?: { uri?: string; title?: string } }> }
    | undefined;

  const seen = new Set<string>();
  const sources: GroundedSource[] = [];
  for (const chunk of meta?.groundingChunks ?? []) {
    const url = chunk.web?.uri;
    if (!url || seen.has(url)) continue;
    seen.add(url);
    sources.push({ title: (chunk.web?.title ?? url).slice(0, 200), url });
    if (sources.length >= 2) break;
  }
  return sources;
}

interface ApiResponse {
  claims?: Array<{
    text?: string;
    claimReview?: Array<{
      publisher?: { name?: string; site?: string };
      url?: string;
      title?: string;
      reviewDate?: string;
      textualRating?: string;
    }>;
  }>;
}

async function search(query: string, languageCode: string, key: string): Promise<Match[] | null> {
  const url = new URL(ENDPOINT);
  url.searchParams.set('query', query);
  url.searchParams.set('languageCode', languageCode);
  url.searchParams.set('pageSize', '5');
  url.searchParams.set('key', key);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as ApiResponse;

    const matches: Match[] = [];
    for (const claim of data.claims ?? []) {
      for (const review of claim.claimReview ?? []) {
        if (!review.url) continue;
        matches.push({
          publisher: review.publisher?.name ?? review.publisher?.site ?? 'Unknown publisher',
          title: (review.title ?? claim.text ?? '').slice(0, 300),
          url: review.url,
          textualRating: (review.textualRating ?? '').slice(0, 120),
          ...(review.reviewDate ? { reviewDate: review.reviewDate } : {}),
        });
      }
    }
    return matches;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const handler = async (req: Request): Promise<Response> => {
  const limit = rateLimit(`fact-check:${clientIp(req)}`);
  if (!limit.allowed) {
    return json(req, { error: 'rate_limited', retryAfterSeconds: limit.retryAfterSeconds }, 429);
  }

  let claims: Array<{ id: string; query: string; languageCodes: string[] }>;
  let ground = false;
  try {
    const body = await readJson(req);
    ground = body.ground === true;
    claims = arr(body.claims, 'claims', LIMITS.claims)
      .filter((c): c is Record<string, unknown> => Boolean(c && typeof c === 'object'))
      .map((c, i) => ({
        id: String(c.id ?? `claim_${i}`).slice(0, 40),
        query: String(c.query ?? '').slice(0, LIMITS.queryChars),
        languageCodes: Array.isArray(c.languageCodes)
          ? (c.languageCodes as unknown[])
              .filter((l): l is string => typeof l === 'string' && /^[a-z]{2}$/.test(l))
              .slice(0, 2)
          : ['en'],
      }))
      .filter((c) => c.query.length > 2);
  } catch (err) {
    const code = err instanceof ValidationError ? err.code : 'invalid_request';
    return json(req, { error: code }, 400);
  }

  const key = Deno.env.get('GOOGLE_API_KEY');
  if (!key) {
    return json(req, { results: claims.map((c) => ({ id: c.id, matches: [] })), unavailable: true });
  }
  if (!claims.length) return json(req, { results: [] });

  let anyFailure = false;

  const results = await Promise.all(
    claims.map(async (claim) => {
      const perLanguage = await Promise.all(
        (claim.languageCodes.length ? claim.languageCodes : ['en']).map((lc) =>
          search(claim.query, lc, key),
        ),
      );

      if (perLanguage.every((r) => r === null)) {
        anyFailure = true;
        return { id: claim.id, matches: [] };
      }

      const seen = new Set<string>();
      const matches: Match[] = [];
      for (const list of perLanguage) {
        for (const m of list ?? []) {
          if (seen.has(m.url)) continue;
          seen.add(m.url);
          matches.push(m);
          if (matches.length >= MAX_MATCHES) break;
        }
        if (matches.length >= MAX_MATCHES) break;
      }

      // No published fact-check: optionally look for grounded reputable links.
      if (!matches.length && ground) {
        const sources = await groundedSources(claim.query);
        if (sources.length) return { id: claim.id, matches, sources };
      }

      return { id: claim.id, matches };
    }),
  );

  return json(req, { results, ...(anyFailure ? { unavailable: true } : {}) });
};

Deno.serve(serveFunction({ name: 'fact-check', handler }));
