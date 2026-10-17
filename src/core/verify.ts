/**
 * AI cannot invent evidence. Every AI-quoted phrase must be a verifiable
 * substring of the original input; anything else is dropped before display.
 */

import type { Span } from './types';

interface Normalised {
  text: string;
  /** index in normalised text -> index in original text */
  map: number[];
}

/** Lowercase, collapse all whitespace runs to one space, keep an index map. */
function normalise(input: string): Normalised {
  let out = '';
  const map: number[] = [];
  let lastWasSpace = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (/\s/.test(ch)) {
      if (lastWasSpace || out.length === 0) continue;
      out += ' ';
      map.push(i);
      lastWasSpace = true;
    } else {
      out += ch.toLowerCase();
      map.push(i);
      lastWasSpace = false;
    }
  }
  while (out.endsWith(' ')) {
    out = out.slice(0, -1);
    map.pop();
  }
  return { text: out, map };
}

/**
 * Find a quote in the original text, ignoring case and whitespace differences.
 * Returns the span in ORIGINAL coordinates, or null if the quote is not present.
 */
export function findQuote(original: string, quote: string, fromIndex = 0): Span | null {
  if (!quote || !quote.trim()) return null;
  const hay = normalise(original);
  const needle = normalise(quote);
  if (!needle.text) return null;

  // Translate fromIndex (original coords) into normalised coords.
  let searchFrom = 0;
  for (let i = 0; i < hay.map.length; i++) {
    if (hay.map[i]! >= fromIndex) {
      searchFrom = i;
      break;
    }
  }

  const at = hay.text.indexOf(needle.text, searchFrom);
  if (at === -1) return null;

  const start = hay.map[at]!;
  const lastNormIndex = at + needle.text.length - 1;
  const lastOriginalIndex = hay.map[lastNormIndex]!;
  return { start, end: lastOriginalIndex + 1 };
}

export function quoteExists(original: string, quote: string): boolean {
  return findQuote(original, quote) !== null;
}

/** Exact substring as it appears in the original, for highlighting. */
export function sliceQuote(original: string, quote: string): string | null {
  const span = findQuote(original, quote);
  return span ? original.slice(span.start, span.end) : null;
}
