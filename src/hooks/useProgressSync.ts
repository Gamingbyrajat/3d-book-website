import { useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { lenis } from '../lenis';
import { useBookStore, persistBookProgress, readSavedBookProgress } from '../store';
import { routeToSpread, numSpreads } from '../content/pages';

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}

function findRouteForSpread(spread: number): string | null {
  for (const [route, s] of Object.entries(routeToSpread)) {
    if (s === spread) return route;
  }
  return null;
}

/** Matches store `displaySpreadIndex` for a float progress (floor vs round when reduced motion). */
function discreteSpreadFromProgress(progress: number, prefersReducedMotion: boolean): number {
  const maxSpread = numSpreads - 1;
  const clamped = Math.max(0, Math.min(progress, maxSpread));
  if (prefersReducedMotion) {
    return Math.min(maxSpread, Math.max(0, Math.round(clamped)));
  }
  return Math.floor(clamped);
}

export function useProgressSync(enabled = true) {
  const location = useLocation();
  const navigate = useNavigate();
  const isBooted = useBookStore((s) => s.isBooted);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeDone = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: { scroll: number; velocity: number }) => {
      const progress = e.scroll / window.innerHeight;
      useBookStore.getState().setProgress(progress);

      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(() => {
        persistBookProgress(useBookStore.getState().progress);
      }, 400);
    };

    lenis.on('scroll', handler);
    return () => {
      lenis.off('scroll', handler);
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [enabled]);

  const scrollToSpread = useCallback((target: number, opts?: { immediate?: boolean }) => {
    const targetPx = target * window.innerHeight;
    if (opts?.immediate) {
      lenis.scrollTo(targetPx, { immediate: true });
    } else {
      lenis.scrollTo(targetPx, {
        duration: 1.2,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
      });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (!isBooted || resumeDone.current) return;
    resumeDone.current = true;

    const saved = readSavedBookProgress();
    if (saved === null) return;

    const clamped = Math.max(0, Math.min(saved, numSpreads - 1));
    const prefersRM = useBookStore.getState().prefersReducedMotion;
    const savedDiscrete = discreteSpreadFromProgress(clamped, prefersRM);
    const urlSpread = routeToSpread[location.pathname];

    requestAnimationFrame(() => {
      if (location.pathname === '/') {
        if (Math.abs(clamped) < 1e-4) return;
        scrollToSpread(clamped, { immediate: true });
        const route = findRouteForSpread(savedDiscrete);
        if (route && route !== '/') {
          navigate(route, { replace: true });
        }
        return;
      }

      if (urlSpread !== undefined) {
        if (urlSpread !== savedDiscrete) return;
        scrollToSpread(clamped, { immediate: true });
      }
    });
  }, [enabled, isBooted, location.pathname, navigate, scrollToSpread]);

  useEffect(() => {
    if (!enabled) return;
    const targetSpread = routeToSpread[location.pathname];
    if (targetSpread === undefined) return;

    const currentSpread = useBookStore.getState().displaySpreadIndex;
    if (currentSpread === targetSpread) return;

    const delay = useBookStore.getState().isBooted ? 50 : 2500;
    const timer = setTimeout(() => scrollToSpread(targetSpread), delay);
    return () => clearTimeout(timer);
  }, [enabled, location.pathname, scrollToSpread]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      const current = useBookStore.getState().displaySpreadIndex;
      let target = current;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        target = Math.min(current + 1, numSpreads - 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        target = Math.max(current - 1, 0);
      } else if (e.key === 'Home') {
        e.preventDefault();
        target = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        target = numSpreads - 1;
      } else {
        return;
      }

      if (target !== current) {
        const route = findRouteForSpread(target);
        if (route) {
          navigate(route);
        } else {
          scrollToSpread(target);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, navigate, scrollToSpread]);
}
