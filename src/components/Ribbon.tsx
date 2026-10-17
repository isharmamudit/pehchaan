/**
 * The thick coloured ribbon that weaves behind the big headlines.
 * It draws itself as the section scrolls past, and is purely decorative.
 */

import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../lib/motion';

interface RibbonProps {
  /** SVG path, drawn in a 1200 x 600 viewBox. */
  d: string;
  color?: string;
  width?: number;
  className?: string;
}

export default function Ribbon({ d, color = 'var(--indigo)', width = 86, className = '' }: RibbonProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;

    if (prefersReducedMotion()) {
      path.style.strokeDashoffset = '0';
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        path,
        { strokeDashoffset: length },
        {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: path.closest('svg'),
            start: 'top 95%',
            end: 'bottom 30%',
            scrub: 0.6,
          },
        },
      );
    });

    return () => ctx.revert();
  }, [d]);

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 1200 600"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        ref={pathRef}
        d={d}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
