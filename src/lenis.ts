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

let imageInspectScrollLockDepth = 0;

/** Pause Lenis wheel/smooth scrolling while the image inspect modal is open (nested-safe). */
export function setLenisImageInspectScrollLock(locked: boolean) {
  if (locked) {
    imageInspectScrollLockDepth += 1;
    if (imageInspectScrollLockDepth === 1) lenis.stop();
  } else {
    imageInspectScrollLockDepth = Math.max(0, imageInspectScrollLockDepth - 1);
    if (imageInspectScrollLockDepth === 0) lenis.start();
  }
}

function raf(time: number) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);
