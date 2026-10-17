/**
 * Fixed top bar: wordmark, language toggle, Get Help Now (on every route)
 * and the full-screen menu.
 */

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PillButton, PillLink } from './Pill';
import { useLanguage } from '../lib/language';
import { landing } from '../i18n/landing';
import { lockScroll } from '../lib/motion';
import type { Localised } from '../core/tactics';

const L = (en: string, hi: string): Localised => ({ en, hi });

const MENU_ITEMS: Array<{ to: string; label: Localised; note: Localised }> = [
  { to: '/check', label: L('Check', 'जाँचें'), note: L('Message, link, screenshot, QR or voice', 'संदेश, लिंक, स्क्रीनशॉट, क्यूआर या आवाज़') },
  { to: '/practise', label: L('Practise', 'अभ्यास'), note: L('Spar with a simulated scammer', 'नकली ठग से अभ्यास') },
  { to: '/protect', label: L('Protect', 'बचाव'), note: L('Post X-Ray and privacy check-up', 'पोस्ट एक्स-रे और प्राइवेसी जाँच') },
  { to: '/how-it-works', label: L('How it works', 'यह कैसे काम करता है'), note: L('The nine tactics and our evidence badges', 'नौ चालें और हमारे सबूत बैज') },
  { to: '/help', label: L('Get help now', 'अभी मदद चाहिए'), note: L('1930, Chakshu, your bank', '1930, चक्षु, आपका बैंक') },
  { to: '/demo', label: L('Demo', 'डेमो'), note: L('Preloaded examples', 'पहले से भरे उदाहरण') },
];

/**
 * Watches sections marked `data-nav-dark` and reports whether one of them is
 * currently under the bar, so the bar can switch to white ink over black.
 */
function useOverDarkSection(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('[data-nav-dark]'));
    if (!sections.length) {
      setDark(false);
      return;
    }

    const check = () => {
      // The bar sits in the top ~88px of the viewport.
      const probe = 56;
      setDark(
        sections.some((section) => {
          const r = section.getBoundingClientRect();
          return r.top <= probe && r.bottom >= probe;
        }),
      );
    };

    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  return dark;
}

export default function SiteNav() {
  const { s, lang, toggle } = useLanguage();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const overDark = useOverDarkSection();
  const dark = overDark || open;

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    lockScroll(open);
    return () => lockScroll(false);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const inkClass = dark ? 'text-white' : 'text-ink';

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[70]">
        <div className="edge flex items-center justify-between gap-3 py-4 sm:items-start sm:py-5">
          <Link
            to="/"
            className={`pointer-events-auto whitespace-nowrap text-[1.05rem] font-bold uppercase tracking-[0.02em] transition-colors duration-300 sm:text-[1.6rem] ${inkClass}`}
          >
            {s(landing.nav.brand)}
          </Link>

          <nav className="pointer-events-auto flex items-center gap-1.5 sm:gap-2" aria-label="Primary">
            <PillButton
              tone={dark ? 'ghost' : 'light'}
              onClick={toggle}
              ariaLabel={s(landing.nav.langLabel)}
              className="!px-3.5 sm:!px-4"
            >
              {s(landing.nav.langShort)}
            </PillButton>

            <PillLink to="/help" tone="dark" dot className="!px-3.5 sm:!px-5">
              <span className="sm:hidden">{s(landing.nav.helpShort)}</span>
              <span className="hidden sm:inline">{s(landing.nav.help)}</span>
            </PillLink>

            <PillButton
              tone={dark ? 'ghost' : 'light'}
              onClick={() => setOpen((v) => !v)}
              ariaExpanded={open}
              ariaLabel={open ? s(landing.nav.close) : s(landing.nav.menu)}
              className="!px-3.5 sm:!px-5"
            >
              <span className="hidden sm:inline">
                {open ? s(landing.nav.close) : s(landing.nav.menu)}
              </span>
              <span aria-hidden className="flex gap-1">
                <span className="h-1 w-1 rounded-full bg-current" />
                <span className="h-1 w-1 rounded-full bg-current" />
              </span>
            </PillButton>
          </nav>
        </div>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-[65] overflow-y-auto bg-night text-white"
          role="dialog"
          aria-modal="true"
          aria-label={s(landing.nav.menu)}
        >
          <div className="edge flex min-h-full flex-col justify-center py-28">
            <ul className="space-y-2">
              {MENU_ITEMS.map((item) => (
                <li key={item.to} className="border-b border-white/15 pb-2">
                  <Link
                    to={item.to}
                    className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3"
                  >
                    <span
                      className="display"
                      style={{ fontSize: 'clamp(2.4rem, 8vw, 6rem)' }}
                    >
                      {s(item.label)}
                    </span>
                    <span className="text-sm text-white/55">{s(item.note)}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-12 max-w-xl text-sm text-white/55">
              {s(landing.footer.disclaimer)}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <PillLink href="tel:1930" tone="ghost">
                {s(landing.footer.call)}
              </PillLink>
              <PillButton tone="ghost" onClick={toggle}>
                {lang === 'en' ? 'हिंदी' : 'English'}
              </PillButton>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
