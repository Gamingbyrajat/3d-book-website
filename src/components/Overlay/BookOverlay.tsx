import { useBookStore } from '../../store';
import { pages } from '../../content/pages';

export function BookOverlay() {
  const spreadIndex = useBookStore((s) => s.spreadIndex);

  const idxFlapFront = spreadIndex * 2;
  const currentPage = pages[idxFlapFront];

  return (
    <div className="sr-only" aria-live="polite" role="status">
      {currentPage?.title && <span>Now viewing: {currentPage.title}</span>}
    </div>
  );
}
