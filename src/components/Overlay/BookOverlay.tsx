import { useBookStore } from '../../store';
import { pages, numSpreads } from '../../content/pages';

export function BookOverlay() {
  const displaySpread = useBookStore((s) => s.displaySpreadIndex);

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
