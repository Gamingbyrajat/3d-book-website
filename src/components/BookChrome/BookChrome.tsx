import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { lenis } from '../../lenis';
import { useBookStore } from '../../store';
import { numSpreads, routeToSpread } from '../../content/pages';
import './BookChrome.css';

function findRouteForSpread(spread: number): string | null {
  for (const [route, s] of Object.entries(routeToSpread)) {
    if (s === spread) return route;
  }
  return null;
}

export function BookProgressIndicator() {
  const displaySpread = useBookStore((s) => s.displaySpreadIndex);

  return (
    <div className="book-progress-indicator" aria-hidden="true">
      <span className="book-progress-label">Spread</span>
      <span className="book-progress-current">{displaySpread + 1}</span>
      <span className="book-progress-of">of</span>
      <span className="book-progress-total">{numSpreads}</span>
    </div>
  );
}

export function SpreadNavTapZones() {
  const navigate = useNavigate();
  const displaySpreadIndex = useBookStore((s) => s.displaySpreadIndex);

  const go = useCallback(
    (delta: number) => {
      const current = displaySpreadIndex;
      const target = Math.min(numSpreads - 1, Math.max(0, current + delta));
      if (target === current) return;
      const route = findRouteForSpread(target);
      if (route) {
        navigate(route);
      } else {
        lenis.scrollTo(target * window.innerHeight, {
          duration: 1.2,
          easing: (t: number) => 1 - Math.pow(1 - t, 3),
        });
      }
    },
    [navigate, displaySpreadIndex],
  );

  return (
    <div className="spread-nav-tap-zones" aria-label="Turn pages">
      <button
        type="button"
        className="spread-nav-zone spread-nav-zone--prev"
        aria-label="Previous spread"
        onClick={() => go(-1)}
      />
      <button
        type="button"
        className="spread-nav-zone spread-nav-zone--next"
        aria-label="Next spread"
        onClick={() => go(1)}
      />
    </div>
  );
}
