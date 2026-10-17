import { lazy, Suspense, useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Placeholder from './pages/Placeholder';
import ErrorBoundary from './components/ErrorBoundary';

// Every screen except the landing page loads on demand.
const Check = lazy(() => import('./pages/Check'));
const Practise = lazy(() => import('./pages/Practise'));
const Spar = lazy(() => import('./pages/Spar'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Protect = lazy(() => import('./pages/Protect'));
const Checkup = lazy(() => import('./pages/Checkup'));
const Help = lazy(() => import('./pages/Help'));
const HowItWorks = lazy(() => import('./pages/HowItWorks'));
const Demo = lazy(() => import('./pages/Demo'));
const DemoRun = lazy(() => import('./pages/DemoRun'));
const Lab = lazy(() => import('./pages/Lab'));
import Preloader from './components/Preloader';
import SiteNav from './components/SiteNav';
import { LanguageProvider } from './lib/language';
import { ScrollTrigger, startSmoothScroll } from './lib/motion';
import type { Localised } from './core/tactics';

const L = (en: string, hi: string): Localised => ({ en, hi });

function Shell() {
  const [loaded, setLoaded] = useState(false);
  const location = useLocation();

  useEffect(() => startSmoothScroll(), []);


  // New route: start at the top and let ScrollTrigger remeasure.
  useEffect(() => {
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  }, [location.pathname]);

  /**
   * The preloader covers the page while triggers are first created, so every
   * measurement is taken against a locked, zero-height document. Re-measure
   * once it has gone, or the reveals never fire and their content stays hidden.
   */
  useEffect(() => {
    if (!loaded) return;
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 60);
    return () => window.clearTimeout(id);
  }, [loaded]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-white"
      >
        Skip to content
      </a>

      {loaded ? null : <Preloader onDone={() => setLoaded(true)} />}

      <SiteNav />

      <ErrorBoundary key={location.pathname}>
        <Suspense fallback={<div className="edge pt-32 text-sm text-ink-mute">…</div>}>
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/check" element={<Check />} />
        <Route path="/practise" element={<Practise />} />
        <Route path="/practise/quiz/:set" element={<Quiz />} />
        <Route path="/practise/:personaId" element={<Spar />} />
        <Route path="/protect" element={<Protect />} />
        <Route path="/protect/checkup" element={<Checkup />} />
        <Route path="/help" element={<Help />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/demo" element={<Demo />} />
          <Route path="/demo/run" element={<DemoRun />} />
        <Route path="/lab" element={<Lab />} />
          <Route path="*" element={<Placeholder title={L('Not found', 'नहीं मिला')} />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Shell />
    </LanguageProvider>
  );
}
