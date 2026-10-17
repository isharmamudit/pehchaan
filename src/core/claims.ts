/**
 * Claim labelling. The label comes from the fact-check publisher's own
 * rating string, mapped in code. Gemini never decides whether a claim is true.
 */

import type { Claim, ClaimLabel, ClaimTopic, FactCheckMatch } from './types';
import { OFFICIAL_SOURCES } from '../config/officialSources';

const FALSE_RE = /\b(false|fake|misleading|incorrect|hoax|scam|baseless|debunked|no evidence|pants on fire)\b/i;
const MIXED_RE = /\b(mix|mixture|partly|partially|half|unproven|disputed|needs context|missing context|exaggerat)/i;
const TRUE_RE = /\b(true|correct|accurate|verified|confirmed)\b/i;

/** Mixed is checked first: "partly true" must not read as "true". */
export function labelFromRating(rating: string | undefined | null): ClaimLabel | null {
  if (!rating) return null;
  const r = rating.trim();
  if (!r) return null;
  if (MIXED_RE.test(r)) return 'disputed';
  if (FALSE_RE.test(r)) return 'fact_checked_false';
  if (TRUE_RE.test(r)) return 'fact_checked_accurate';
  return null;
}

/** The strongest label across the returned matches wins. */
export function labelClaim(
  kind: Claim['kind'],
  matches: FactCheckMatch[],
): { label: ClaimLabel; evidence: Claim['evidence'] } {
  // Non-checkable kinds carry straight through: there is nothing to fact-check.
  if (kind === 'opinion') return { label: 'opinion', evidence: 'ai' };
  if (kind === 'bait') return { label: 'bait', evidence: 'ai' };
  if (kind === 'unverifiable') return { label: 'unverifiable', evidence: 'ai' };
  if (!matches.length) return { label: 'not_verified', evidence: 'ai' };

  const labels = matches
    .map((m) => labelFromRating(m.textualRating))
    .filter((l): l is ClaimLabel => l !== null);

  if (labels.includes('fact_checked_false')) return { label: 'fact_checked_false', evidence: 'source' };
  if (labels.includes('disputed')) return { label: 'disputed', evidence: 'source' };
  if (labels.includes('fact_checked_accurate')) return { label: 'fact_checked_accurate', evidence: 'source' };
  return { label: 'not_verified', evidence: 'ai' };
}

export const CLAIM_LABELS: Record<ClaimLabel, { en: string; hi: string }> = {
  fact_checked_false: { en: 'Fact-checked: false', hi: 'फ़ैक्ट-चेक: ग़लत' },
  fact_checked_accurate: { en: 'Fact-checked: accurate', hi: 'फ़ैक्ट-चेक: सही' },
  disputed: { en: 'Disputed', hi: 'विवादित' },
  not_verified: { en: 'Not verified', hi: 'पुष्टि नहीं' },
  opinion: { en: 'Opinion', hi: 'राय' },
  bait: { en: 'Engagement bait', hi: 'फैलाने का चारा' },
  unverifiable: { en: 'Unverifiable', hi: 'जाँच असंभव' },
};

export const CLAIM_LABEL_NOTE: Record<ClaimLabel, { en: string; hi: string }> = {
  fact_checked_false: {
    en: 'A publisher has reviewed this and rated it false.',
    hi: 'एक प्रकाशक ने इसकी जाँच करके इसे ग़लत बताया है।',
  },
  fact_checked_accurate: {
    en: 'A publisher has reviewed this and rated it accurate.',
    hi: 'एक प्रकाशक ने इसकी जाँच करके इसे सही बताया है।',
  },
  disputed: {
    en: 'Reviewers disagree, or it is only partly true.',
    hi: 'समीक्षकों में मतभेद है, या यह आंशिक रूप से ही सही है।',
  },
  not_verified: {
    en: 'No published fact-check found. That means unchecked, not false.',
    hi: 'कोई प्रकाशित फ़ैक्ट-चेक नहीं मिला। इसका मतलब "जाँचा नहीं गया" है, "ग़लत" नहीं।',
  },
  opinion: {
    en: 'A judgement, not a factual claim. There is nothing to fact-check.',
    hi: 'यह राय है, तथ्य का दावा नहीं। इसमें जाँचने लायक कुछ नहीं।',
  },
  bait: {
    en: 'Written to be forwarded, not to inform. Spreading it is the whole purpose.',
    hi: 'यह बताने के लिए नहीं, फैलाने के लिए लिखा गया है। फैलना ही इसका पूरा मक़सद है।',
  },
  unverifiable: {
    en: 'Factual in form, but with no source anyone could check.',
    hi: 'दिखने में तथ्य, पर ऐसा कोई स्रोत नहीं जिसे कोई जाँच सके।',
  },
};

/** Unchecked claims get a "Verify in 60 seconds" card pointing at the official source. */
export function needsVerifyCard(label: ClaimLabel): boolean {
  return label === 'not_verified' || label === 'disputed' || label === 'unverifiable';
}

export function verifyCardFor(topic: ClaimTopic) {
  return OFFICIAL_SOURCES[topic] ?? OFFICIAL_SOURCES.other;
}
