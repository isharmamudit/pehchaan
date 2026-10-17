/**
 * Resolve a finding's explanation in the current language at render time.
 *
 * Rule explanations exist in both languages in code, so a finding produced in
 * one language still reads correctly if the user switches afterwards. AI
 * explanations only exist in the language they were generated in.
 */

import { HOAX_TEMPLATES } from './hoaxTemplates';
import { RULES } from './rules';
import type { Lang } from './tactics';
import type { Finding } from './types';

const BY_ID = new Map<string, { en: string; hi: string }>();
for (const rule of RULES) BY_ID.set(rule.id, rule.explanation);
for (const template of HOAX_TEMPLATES) BY_ID.set(template.id, template.explanation);

export function explanationFor(finding: Finding, lang: Lang): string {
  if (finding.ruleId) {
    const localised = BY_ID.get(finding.ruleId);
    if (localised) return localised[lang];
  }
  return finding.explanation;
}
