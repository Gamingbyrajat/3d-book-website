import Lenis from 'lenis';

export const lenis = new Lenis({
  duration: 1.4,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  syncTouch: false,
});

/** Wheel smoothing off reads closer to discrete spreads when prefers-reduced-motion is on. */
export function setLenisSmoothWheel(enabled: boolean) {
  lenis.options.smoothWheel = enabled;
}

function raf(time: number) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);
