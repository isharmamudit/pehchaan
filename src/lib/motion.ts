/**
 * Motion layer: Lenis for inertia scrolling, GSAP ScrollTrigger for reveals.
 *
 * Every effect is opt-out: with prefers-reduced-motion, Lenis never starts and
 * reveals resolve immediately. Content is visible by default, so a failure in
 * here can never leave the page blank.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

let lenis: Lenis | null = null;

export function getLenis(): Lenis | null {
  return lenis;
}

/** Start smooth scrolling. Returns a cleanup function. */
export function startSmoothScroll(): () => void {
  if (prefersReducedMotion()) return () => {};

  lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
  });

  lenis.on('scroll', ScrollTrigger.update);

  const tick = (time: number) => lenis?.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  };
}

export function lockScroll(locked: boolean): void {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}

export function scrollToTop(): void {
  if (lenis) lenis.scrollTo(0, { immediate: false });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function scrollToSelector(selector: string): void {
  const el = document.querySelector(selector);
  if (!el) return;
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset: -40 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

/* ------------------------------------------------------------------ reveals */

export interface RevealOptions {
  y?: number;
  delay?: number;
  stagger?: number;
  duration?: number;
  /** How far into the viewport the element must come. 0.15 = 15%. */
  threshold?: number;
}

/**
 * Fade-and-rise elements the first time they enter the viewport.
 *
 * This uses IntersectionObserver rather than ScrollTrigger on purpose: a
 * reveal that never fires leaves its content invisible, and ScrollTrigger
 * depends on measurements taken at setup, which go stale behind a preloader,
 * a hot reload or a late font swap. The observer cannot drift, and if
 * anything throws the content is simply left visible.
 */
export function revealOnEnter(
  trigger: Element | null,
  targets: Element[] | HTMLCollection,
  { y = 48, delay = 0, stagger = 0.08, duration = 0.9, threshold = 0.12 }: RevealOptions = {},
): () => void {
  const items = Array.from(targets) as Element[];
  if (!trigger || !items.length || prefersReducedMotion()) return () => {};

  gsap.set(items, { opacity: 0, y });

  const play = () => {
    gsap.to(items, { opacity: 1, y: 0, duration, delay, stagger, ease: 'power3.out' });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      play();
    },
    { threshold, rootMargin: '0px 0px -8% 0px' },
  );

  observer.observe(trigger);

  // Safety net: if the observer never fires (detached, zero-size, odd layout),
  // show the content anyway rather than leaving a blank section.
  const safety = window.setTimeout(() => {
    observer.disconnect();
    gsap.set(items, { opacity: 1, y: 0 });
  }, 6000);

  return () => {
    observer.disconnect();
    window.clearTimeout(safety);
    gsap.set(items, { opacity: 1, y: 0 });
  };
}

/** Split a line of text into word spans so each word can rise on its own. */
export function splitWords(el: HTMLElement): HTMLSpanElement[] {
  const text = el.textContent ?? '';
  el.textContent = '';
  const spans: HTMLSpanElement[] = [];

  for (const [i, word] of text.split(/\s+/).filter(Boolean).entries()) {
    const outer = document.createElement('span');
    outer.style.display = 'inline-block';
    outer.style.overflow = 'hidden';
    outer.style.verticalAlign = 'top';

    const inner = document.createElement('span');
    inner.style.display = 'inline-block';
    inner.textContent = word;

    outer.appendChild(inner);
    el.appendChild(outer);
    if (i >= 0) el.appendChild(document.createTextNode(' '));
    spans.push(inner);
  }

  return spans;
}

export { gsap, ScrollTrigger };
