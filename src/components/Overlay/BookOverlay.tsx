import { useBookStore } from '../../store';
import { pages, numSpreads } from '../../content/pages';

export function BookOverlay() {
  const progress = useBookStore((s) => s.progress);
  const spreadIndex = useBookStore((s) => s.spreadIndex);
  const prefersRM = useBookStore((s) => s.prefersReducedMotion);

  const displaySpread = prefersRM
    ? Math.min(numSpreads - 1, Math.max(0, Math.round(progress)))
    : spreadIndex;

  const idxFlapFront = displaySpread * 2;
  const currentPage = pages[idxFlapFront];

  return (
    <div className="sr-only" aria-live="polite" role="status">
      {currentPage?.title && (
        <span>
          Spread {displaySpread + 1} of {numSpreads}. Now viewing: {currentPage.title}
        </span>
      )}
    </div>
  );
}
