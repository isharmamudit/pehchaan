/** Endless row of the nine tactic names, drawn from the shared tactic library. */

import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../lib/motion';
import { TACTIC_IDS, TACTICS } from '../core/tactics';
import { useLanguage } from '../lib/language';

export default function TacticsMarquee({ dark = false }: { dark?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { lang } = useLanguage();

  useEffect(() => {
    const track = trackRef.current;
    if (!track || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.to(track, {
        xPercent: -50,
        duration: 38,
        ease: 'none',
        repeat: -1,
      });
    }, track);

    return () => ctx.revert();
  }, [lang]);

  const names = TACTIC_IDS.map((id) => TACTICS[id].name[lang]);
  const doubled = [...names, ...names];

  return (
    <div className="relative overflow-hidden py-6" aria-hidden="true">
      <div ref={trackRef} className="flex w-max items-center gap-10 whitespace-nowrap">
        {doubled.map((name, i) => (
          <span key={i} className="flex items-center gap-10">
            <span
              className="display"
              style={{
                fontSize: 'clamp(1.8rem, 4.6vw, 4rem)',
                color: dark ? 'rgba(255,255,255,0.92)' : 'var(--ink)',
              }}
            >
              {name}
            </span>
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: i % 2 ? 'var(--cyan)' : 'var(--indigo)' }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
