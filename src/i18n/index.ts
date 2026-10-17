import { en, type Strings } from './en';
import { hi } from './hi';
import type { Lang } from '../core/tactics';

export const STRINGS: Record<Lang, Strings> = { en, hi };

export function t(lang: Lang): Strings {
  return STRINGS[lang] ?? en;
}

export type { Strings };
