/** Language choice, stored locally and applied to the document element. */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getLanguage, setLanguage as persist } from './storage';
import type { Lang, Localised } from '../core/tactics';

interface LanguageValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  /** Pick the right side of a {en, hi} pair. */
  s: (pair: Localised) => string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getLanguage());

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    persist(next);
  }, []);

  const value = useMemo<LanguageValue>(
    () => ({
      lang,
      setLang,
      toggle: () => setLang(lang === 'en' ? 'hi' : 'en'),
      s: (pair: Localised) => pair[lang],
    }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
