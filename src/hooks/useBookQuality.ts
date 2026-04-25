import { useMemo, useSyncExternalStore } from 'react';

const MOBILE_MAX = 768;
const LOW_DPR = 1.25;

function subscribeResize(cb: () => void) {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
}

function getSnapshot() {
  return `${window.innerWidth}|${window.devicePixelRatio}`;
}

export type BookQualityTier = 'high' | 'medium' | 'low';

export function getBookQualityTier(): BookQualityTier {
  const w = typeof window === 'undefined' ? 1200 : window.innerWidth;
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  if (w < MOBILE_MAX || dpr < LOW_DPR) return 'low';
  if (w < 1100 || dpr < 1.75) return 'medium';
  return 'high';
}

/** Subscribes to resize so Canvas / flap can adapt without prop drilling from R3F. */
export function useBookQuality() {
  const snap = useSyncExternalStore(subscribeResize, getSnapshot, () => '1200|1');

  return useMemo(() => {
    void snap;
    const tier = getBookQualityTier();
    const segmentsX = tier === 'high' ? 48 : tier === 'medium' ? 36 : 22;
    const segmentsY = tier === 'high' ? 24 : tier === 'medium' ? 18 : 14;
    const dprCap = tier === 'high' ? 2 : tier === 'medium' ? 1.75 : 1.25;
    const useContactShadows = tier !== 'low';
    return { tier, segmentsX, segmentsY, dprCap, useContactShadows };
  }, [snap]);
}
