/**
 * check-urls — expands redirects, checks for lookalike domains and queries
 * Safe Browsing. Page content is never fetched and never returned.
 *
 * A "no_match" from Safe Browsing means "not on known blocklists".
 * It never means safe, and the UI must not say so.
 */

import { clientIp, json, serveFunction } from '../_shared/http.ts';
import { rateLimit } from '../_shared/rateLimit.ts';
import { checkLookalike } from '../_shared/lookalike.ts';
import { safeUrl } from '../_shared/netGuard.ts';
import { lookupThreats } from '../_shared/safeBrowsing.ts';
import { arr, LIMITS, ValidationError, readJson } from '../_shared/validate.ts';

const MAX_HOPS = 5;
const HOP_TIMEOUT_MS = 4000;

const SHORTENERS = [
  'bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'is.gd', 'rb.gy', 'shorturl.at',
  'goo.gl', 'ow.ly', 'tiny.cc', 's.id', 'rebrand.ly', 'bitly.com', 't.ly', 'shrtco.de',
];

interface ExpandResult {
  final: string;
  hops: number;
  error?: string;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function isShortener(url: string): boolean {
  const host = hostOf(url);
  return SHORTENERS.some((s) => host === s || host.endsWith(`.${s}`));
}

async function headOrGet(url: string): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HOP_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'user-agent': 'SachYaScam-LinkChecker/1.0' },
    });
    // Some hosts refuse HEAD; retry with GET but never read the body.
    if (res.status === 405 || res.status === 501) {
      await res.body?.cancel();
      const getRes = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'user-agent': 'SachYaScam-LinkChecker/1.0' },
      });
      await getRes.body?.cancel();
      return getRes;
    }
    await res.body?.cancel();
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Follow up to MAX_HOPS redirects, re-checking the guard before every request. */
async function expand(startUrl: string): Promise<ExpandResult> {
  let current = startUrl;
  let hops = 0;

  for (let i = 0; i < MAX_HOPS; i++) {
    const guard = await safeUrl(current);
    if (!guard.ok) return { final: current, hops, error: guard.reason };

    const res = await headOrGet(current);
    if (!res) return { final: current, hops, error: 'unreachable' };

    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      let next: string;
      try {
        next = new URL(location, current).toString();
      } catch {
        return { final: current, hops, error: 'bad_redirect' };
      }
      current = next;
      hops += 1;
      continue;
    }
    return { final: current, hops };
  }

  return { final: current, hops, error: 'too_many_redirects' };
}

export const handler = async (req: Request): Promise<Response> => {
  const limit = rateLimit(`check-urls:${clientIp(req)}`);
  if (!limit.allowed) {
    return json(req, { error: 'rate_limited', retryAfterSeconds: limit.retryAfterSeconds }, 429);
  }

  let urls: string[];
  try {
    const body = await readJson(req);
    urls = arr(body.urls, 'urls', LIMITS.urls)
      .filter((u): u is string => typeof u === 'string' && u.length <= LIMITS.urlChars)
      // A bare domain gets http://. Anything with another scheme (file:, ftp:,
      // javascript:) is left as-is so the guard rejects it as unsupported.
      .map((u) => (/^[a-z][a-z0-9+.-]*:/i.test(u) ? u : `http://${u}`));
  } catch (err) {
    const code = err instanceof ValidationError ? err.code : 'invalid_request';
    return json(req, { error: code }, 400);
  }

  if (!urls.length) return json(req, { results: [] });

  const expanded = await Promise.all(
    urls.map(async (original) => {
      const guard = await safeUrl(original);
      if (!guard.ok) {
        return { original, final: original, hops: 0, error: guard.reason };
      }
      const r = await expand(original);
      return { original, ...r };
    }),
  );

  const threatCheck = await lookupThreats(
    expanded.flatMap((e) => [e.original, e.final]),
  );

  const hitUrls = new Map<string, string[]>();
  if (threatCheck.ok) {
    for (const hit of threatCheck.hits) {
      const list = hitUrls.get(hit.url) ?? [];
      list.push(hit.threatType);
      hitUrls.set(hit.url, list);
    }
  }

  const results = expanded.map((e) => {
    const threats = [
      ...(hitUrls.get(e.original) ?? []),
      ...(hitUrls.get(e.final) ?? []),
    ];
    return {
      original: e.original,
      final: e.final,
      hops: e.hops,
      isShortener: isShortener(e.original),
      lookalike: checkLookalike(hostOf(e.final) || hostOf(e.original)),
      safeBrowsing: !threatCheck.ok
        ? ('unavailable' as const)
        : threats.length
          ? ('match' as const)
          : ('no_match' as const),
      ...(threats.length ? { threatTypes: [...new Set(threats)] } : {}),
      ...(e.error ? { error: e.error } : {}),
    };
  });

  return json(req, { results, safeBrowsingUnavailable: !threatCheck.ok });
};

Deno.serve(serveFunction({ name: 'check-urls', handler }));
