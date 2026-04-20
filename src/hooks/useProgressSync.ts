import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { lenis } from '../lenis';
import { useBookStore } from '../store';
import { routeToSpread, numSpreads } from '../content/pages';

export function useProgressSync() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: { scroll: number; velocity: number }) => {
      const progress = e.scroll / window.innerHeight;
      useBookStore.getState().setProgress(progress);
    };

    lenis.on('scroll', handler);
    return () => {
      lenis.off('scroll', handler);
    };
  }, []);

  const scrollToSpread = useCallback((target: number) => {
    const targetPx = target * window.innerHeight;
    lenis.scrollTo(targetPx, {
      duration: 1.2,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });
  }, []);

  useEffect(() => {
    const targetSpread = routeToSpread[location.pathname];
    if (targetSpread === undefined) return;

    const currentSpread = Math.round(useBookStore.getState().progress);
    if (currentSpread === targetSpread) return;

    const delay = useBookStore.getState().isBooted ? 50 : 2500;
    const timer = setTimeout(() => scrollToSpread(targetSpread), delay);
    return () => clearTimeout(timer);
  }, [location.pathname, scrollToSpread]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const current = Math.round(useBookStore.getState().progress);
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
  }, [navigate, scrollToSpread]);
}

function findRouteForSpread(spread: number): string | null {
  for (const [route, s] of Object.entries(routeToSpread)) {
    if (s === spread) return route;
  }
  return null;
}
