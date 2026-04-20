# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static prototype of a 3D interactive "book" driven by native scroll. No build system, no package manager, no tests — it's plain HTML/CSS/JS served as files. ES modules, so it must be loaded over HTTP, not `file://`.

Run locally with any static server, e.g. `python3 -m http.server` from the project root, then open `http://localhost:8000/`.

`nextjs_book_architecture_plan.md` describes a *future* Next.js rewrite that decouples 3D animation from React-overlay text and uses WebM sequences (Opening / Turn Right / Turn Left) instead of CSS transforms. The current code in `js/` and `css/` does NOT implement that plan — don't conflate them. Treat the plan as a forward-looking spec unless the user says they're migrating.

## Architecture

The illusion is a trick of stacked layers: native scroll on an invisible container drives a CSS-3D book rendered in a fixed viewport behind it.

- `scroll-container` (z-index 10, `overflow-y: auto`, scroll-snap) captures scroll events and provides height via empty `.scroll-section` divs — one per spread. It sits *on top* of the book with `pointer-events: none` on the viewport so wheel/touch fall through.
- `viewport-container` (z-index 1, `perspective: 2500px`) holds the actual `.book` with `transform-style: preserve-3d`.
- The book has three DOM pages: `page-left` (static), `page-right` (static), and `flap` (the one currently rotating). The flap has two `.face` elements (`front`/`back`) with `backface-visibility: hidden` so only one side shows at a time. Only one flap animates at a time regardless of how many pages exist — content gets swapped as the spread index changes.

### The scroll → fold mapping (`js/app.js`)

Every frame via `requestAnimationFrame`:
1. `rawS = scrollTop / clientHeight` → `spreadIndex = floor(rawS)`, `foldProgress = rawS % 1` (0..1 within current spread).
2. When `spreadIndex` changes, re-render the four slots (`left`, `flap-front`, `flap-back`, `right`) using indices `spreadIndex*2 - 1`, `*2`, `*2 + 1`, `*2 + 2` into `bookData`. Note the offset: spread 0 shows the cover on the flap-front with nothing on the left.
3. `flap.style.transform = rotateY(${foldProgress * -180}deg)` — drive rotation directly off scroll. **Do not add a CSS `transition` on `.flap`** — it desyncs from scroll and causes visible lag (there's a comment about this in `styles.css`).
4. Shadows on `flap-front`/`flap-back` are recomputed each frame from `sin(foldProgress * π)` so lighting peaks mid-turn.
5. Dispatch a `bookScrollVelocity` CustomEvent (px/ms) for the audio layer.

### Audio (`js/audio.js`)

Pure Web Audio: a looping white-noise buffer → bandpass filter (centered ~800 Hz) → gain → destination. No sample files. The `bookScrollVelocity` listener maps scroll speed to gain and filter frequency with `setTargetAtTime` (exponential ramps — don't use `setValueAtTime`, it crackles). AudioContext must be created inside a user gesture; the first `click`/`touchstart` calls `initAudio` and hides the status overlay.

### Content (`js/data.js`)

Flat array of page objects (`{ id, title, content, image, isCover? }`). Adding/removing entries automatically adjusts `numSpreads` and the generated scroll sections. `isCover: true` swaps in the dark cover palette via the `.is-cover` class.

## Gotchas

- `body { overflow: hidden }` is intentional — all scrolling happens inside `.scroll-container`, not the document. Don't "fix" this.
- The flap is always `right: 0` with `transform-origin: left center`; the spine pivot must stay at the geometric center of the book or pages appear to detach.
- `idxRightFlat = spreadIndex*2 + 2` can exceed `bookData.length` on the last spread — `renderPage` handles the undefined case by hiding the element via `opacity: 0`. Preserve that branch when refactoring.
