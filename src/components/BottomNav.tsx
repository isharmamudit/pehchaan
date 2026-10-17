import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../lib/language';

interface TabItem {
  to: string;
  label: { en: string; hi: string };
  isActive: (path: string) => boolean;
  icon: (active: boolean) => JSX.Element;
}

const TABS: TabItem[] = [
  {
    to: '/',
    label: { en: 'Home', hi: 'होम' },
    isActive: (p) => p === '/',
    icon: (active) => (
      <svg
        className={`h-5 w-5 transition-transform ${active ? 'scale-110' : ''}`}
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? '2' : '1.8'}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9.5z" />
      </svg>
    ),
  },
  {
    to: '/check',
    label: { en: 'Check', hi: 'जाँचें' },
    isActive: (p) => p.startsWith('/check'),
    icon: (active) => (
      <svg
        className={`h-5 w-5 transition-transform ${active ? 'scale-110' : ''}`}
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? '2' : '1.8'}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    to: '/practise',
    label: { en: 'Practise', hi: 'अभ्यास' },
    isActive: (p) => p.startsWith('/practise'),
    icon: (active) => (
      <svg
        className={`h-5 w-5 transition-transform ${active ? 'scale-110' : ''}`}
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? '2' : '1.8'}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    to: '/protect',
    label: { en: 'Protect', hi: 'बचाव' },
    isActive: (p) => p.startsWith('/protect'),
    icon: (active) => (
      <svg
        className={`h-5 w-5 transition-transform ${active ? 'scale-110' : ''}`}
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? '2' : '1.8'}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    to: '/demo',
    label: { en: 'Demo', hi: 'डेमो' },
    isActive: (p) => p.startsWith('/demo'),
    icon: (active) => (
      <svg
        className={`h-5 w-5 transition-transform ${active ? 'scale-110' : ''}`}
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? '2' : '1.8'}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const { s } = useLanguage();
  const location = useLocation();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed inset-x-0 bottom-0 z-[60] block md:hidden w-full max-w-full overflow-hidden border-t border-line/15 bg-white/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
    >
      <div className="grid grid-cols-5 items-center justify-around w-full max-w-full px-0.5">
        {TABS.map((tab) => {
          const active = tab.isActive(location.pathname);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex flex-col items-center justify-center py-1.5 transition-all duration-150 active:scale-90 ${
                active
                  ? 'text-indigo font-semibold'
                  : 'text-ink-mute hover:text-ink'
              }`}
            >
              <div
                className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                  active ? 'bg-indigo/10 text-indigo' : 'text-ink-mute'
                }`}
              >
                {tab.icon(active)}
              </div>
              <span className="mt-0.5 text-[0.68rem] tracking-tight">
                {s(tab.label)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
