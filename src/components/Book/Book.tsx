import { useBookStore } from '../../store';
import { pages, numSpreads } from '../../content/pages';
import { Page } from './Page';
import { Flap } from './Flap';
import { Spine } from './Spine';
import { BookEdge } from './BookEdge';

const BOOK_WIDTH = 5.8;
const BOOK_HEIGHT = 3.6;
const SPINE_THICKNESS = 0.04;

export function Book() {
  const spreadIndex = useBookStore((s) => s.displaySpreadIndex);

  const idxLeftFlat = spreadIndex * 2 - 1;
  const idxFlapFront = spreadIndex * 2;
  const idxFlapBack = spreadIndex * 2 + 1;
  const idxRightFlat = spreadIndex * 2 + 2;

  const leftPage = pages[idxLeftFlat];
  const flapFront = pages[idxFlapFront];
  const flapBack = pages[idxFlapBack];
  const rightPage = pages[idxRightFlat];

  const isLastSpread = spreadIndex >= numSpreads - 1;

  return (
    <group position={[0, isLastSpread ? -0.2 : -0.2, 0]}>
      {/* Book edge — spine, back cover, page edges */}
      <BookEdge
        bookWidth={BOOK_WIDTH}
        bookHeight={BOOK_HEIGHT}
        pageCount={pages.length}
      />

      {/* Left static page */}
      <Page
        side="left"
        bookWidth={BOOK_WIDTH}
        bookHeight={BOOK_HEIGHT}
        page={leftPage}
        visible={!!leftPage}
      />

      {/* Turning page flap — hidden at last spread */}
      <Flap
        bookWidth={BOOK_WIDTH}
        bookHeight={BOOK_HEIGHT}
        frontPage={flapFront}
        backPage={flapBack}
        reactSpreadIndex={spreadIndex}
      />

      {/* Right static page (under the flap) */}
      <Page
        side="right"
        bookWidth={BOOK_WIDTH}
        bookHeight={BOOK_HEIGHT}
        page={rightPage}
        visible={!!rightPage && !rightPage.isFormPage}
      />

      {/* Center spine line — hide at last spread (book is closed) */}
      {!isLastSpread && (
        <Spine bookHeight={BOOK_HEIGHT} thickness={SPINE_THICKNESS} />
      )}
    </group>
  );
}

export { BOOK_WIDTH, BOOK_HEIGHT };
