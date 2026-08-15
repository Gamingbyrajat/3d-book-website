import { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { findRouteForPageIndex, pages, routeToPageIndex } from '../../content/pages';
import { useBookStore } from '../../store';
import './MobileReader.css';

const SWIPE_THRESHOLD_PX = 48;

function splitParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function MobileReader() {
  const location = useLocation();
  const navigate = useNavigate();
  const openImageInspect = useBookStore((s) => s.openImageInspect);
  const touchStartX = useRef<number | null>(null);

  const readablePageIndexes = useMemo(
    () => pages.map((page, index) => ({ page, index })).filter(({ page }) => !page.isFormPage).map(({ index }) => index),
    [],
  );

  const [readerState, setReaderState] = useState(() => ({
    pageIndex: routeToPageIndex[location.pathname] ?? readablePageIndexes[0] ?? 0,
    sourceKey: location.key,
  }));

  const routedPageIndex = routeToPageIndex[location.pathname];
  const pageIndex =
    readerState.sourceKey === location.key
      ? readerState.pageIndex
      : routedPageIndex ?? readablePageIndexes[0] ?? 0;
  const readablePosition = Math.max(0, readablePageIndexes.indexOf(pageIndex));
  const page = pages[pageIndex] ?? pages[readablePageIndexes[0] ?? 0];
  const isFirst = readablePosition <= 0;
  const isLast = readablePosition >= readablePageIndexes.length - 1;

  const goToReadablePosition = useCallback(
    (position: number) => {
      const nextPosition = Math.min(readablePageIndexes.length - 1, Math.max(0, position));
      const nextPageIndex = readablePageIndexes[nextPosition];
      if (nextPageIndex === undefined || nextPageIndex === pageIndex) return;

      setReaderState({ pageIndex: nextPageIndex, sourceKey: location.key });
      const route = findRouteForPageIndex(nextPageIndex);
      if (route) navigate(route);
    },
    [location.key, navigate, pageIndex, readablePageIndexes],
  );

  const goPrevious = useCallback(() => goToReadablePosition(readablePosition - 1), [goToReadablePosition, readablePosition]);
  const goNext = useCallback(() => goToReadablePosition(readablePosition + 1), [goToReadablePosition, readablePosition]);

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null) return;
    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) return;

    const deltaX = endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    if (deltaX < 0) goNext();
    else goPrevious();
  };

  const handleImageClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!page.image) return;
    const rect = event.currentTarget.getBoundingClientRect();
    openImageInspect({
      src: page.image,
      alt: page.imageAlt ?? page.title ?? 'Page illustration',
      fromRect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      },
    });
  };

  return (
    <div className={`mobile-reader${page.isCover ? ' mobile-reader--cover' : ''}`}>
      <header className="mobile-reader__topbar">
        <div>
          <p className="mobile-reader__eyebrow">Repo Parking Package</p>
          <p className="mobile-reader__progress">
            Page {readablePosition + 1} of {readablePageIndexes.length}
          </p>
        </div>
      </header>

      <main className="mobile-reader__main" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <article className="mobile-reader__page" aria-labelledby={page.title ? 'mobile-reader-title' : undefined}>
          {page.title && (
            <h1 id="mobile-reader-title" className="mobile-reader__title">
              {page.title}
            </h1>
          )}

          {page.body && (
            <div className="mobile-reader__body">
              {splitParagraphs(page.body).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          )}

          {page.image && (
            <button
              type="button"
              className="mobile-reader__image-button"
              onClick={handleImageClick}
              aria-label={`Open ${page.imageAlt ?? page.title ?? 'page illustration'}`}
            >
              <img className="mobile-reader__image" src={page.image} alt={page.imageAlt ?? ''} loading="lazy" decoding="async" />
            </button>
          )}
        </article>
      </main>

      <nav className="mobile-reader__nav" aria-label="Page navigation">
        <button type="button" className="mobile-reader__nav-button" onClick={goPrevious} disabled={isFirst} aria-label="Previous page">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M11.5 4 6.5 9l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Previous</span>
        </button>
        <button type="button" className="mobile-reader__nav-button" onClick={goNext} disabled={isLast} aria-label="Next page">
          <span>Next</span>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="m6.5 4 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </nav>
    </div>
  );
}
