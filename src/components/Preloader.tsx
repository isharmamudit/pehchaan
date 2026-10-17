/**
 * Black preloader with a 001 → 100 counter, then a curtain reveal.
 * With reduced motion it finishes immediately.
 */

import { useEffect, useRef, useState } from 'react';
import { gsap, lockScroll, prefersReducedMotion } from '../lib/motion';
import { useLanguage } from '../lib/language';
import { landing } from '../i18n/landing';

export default function Preloader({ onDone }: { onDone: () => void }) {
  const { s } = useLanguage();
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(1);

  useEffect(() => {
    lockScroll(true);

    if (prefersReducedMotion()) {
      lockScroll(false);
      onDone();
      return;
    }

    const counter = { value: 1 };

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          lockScroll(false);
          onDone();
        },
      });

      tl.to(counter, {
        value: 100,
        duration: 1.9,
        ease: 'power2.inOut',
        onUpdate: () => setCount(Math.round(counter.value)),
      })
        .to(barRef.current, { scaleX: 1, duration: 1.9, ease: 'power2.inOut' }, 0)
        .to(rootRef.current, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '+=0.15');
    }, rootRef);

    return () => {
      ctx.revert();
      lockScroll(false);
    };
  }, [onDone]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[90] flex flex-col justify-between bg-night text-white"
      role="status"
      aria-live="polite"
      aria-label={s(landing.preloader.line)}
    >
      <div className="flex flex-1 items-center justify-center">
        <div
          ref={barRef}
          className="h-14 w-[min(42vw,420px)] origin-left scale-x-0 rounded-[4px] bg-white"
        />
      </div>

      <div className="flex items-end justify-between p-[var(--gutter)] pb-6">
        <span
          className="display block leading-[0.78] tabular-nums"
          style={{ fontSize: 'clamp(4.5rem, 17vw, 15rem)', fontWeight: 400 }}
        >
          {String(count).padStart(3, '0')}
        </span>
        <span className="mb-4 hidden text-xs uppercase tracking-[0.2em] opacity-60 sm:block">
          {s(landing.preloader.line)}
        </span>
      </div>
    </div>
  );
}
