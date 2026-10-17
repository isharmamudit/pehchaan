/**
 * Recorded demo results. These are produced by `npm run record-demo`, which
 * runs the REAL pipeline and writes whatever it returns. Nothing is written
 * by hand. Each file records how it was produced, and a cached result is
 * always shown with an "offline demo result" label.
 */

import type { AnalysisResult } from '../core/types';

export interface CachedDemo {
  id: string;
  recordedAt: string;
  /** "live" = recorded with all API keys present. "offline_rules_only" = rules and local checks only. */
  source: 'live' | 'offline_rules_only';
  result: AnalysisResult;
}

const modules = import.meta.glob<CachedDemo>('./cache/*.json', {
  eager: true,
  import: 'default',
});

const CACHE = new Map<string, CachedDemo>();
for (const mod of Object.values(modules)) {
  if (mod?.id) CACHE.set(mod.id, mod);
}

export function cachedDemo(id: string): CachedDemo | undefined {
  return CACHE.get(id);
}

export function hasCachedDemo(id: string): boolean {
  return CACHE.has(id);
}

export const CACHED_LABEL = {
  en: 'Offline demo result',
  hi: 'ऑफ़लाइन डेमो परिणाम',
};
