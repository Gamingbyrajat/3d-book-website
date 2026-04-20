# Interactive 3D Book Portfolio — Architecture Plan

A production-quality interactive "book" built with **Vite + React + Three.js**. Smooth scroll-driven page turning AND click navigation on navbar items. Real 3D page curl via GPU vertex shaders — not baked video, not CSS flips. Text lives in a plain content file, editable at any time, and supports adding/removing pages with no asset re-rendering.

---

## 1. Design Goals (non-negotiable)

1. Buttery-smooth scroll — 60fps floor on desktop, 30fps floor on 4-year-old phones
2. Click navigation on navbar items with eased transitions, fully unified with scroll state
3. Real 3D page bend (curl, shading, lighting) — not flat CSS rotation
4. Text is plain HTML, editable in one content file
5. Page count is data-driven — add/remove entries with no code or asset changes
6. Audio paper-rustle synth (port from current prototype) synced to scroll velocity
7. Keyboard and reduced-motion accessible
8. Premium visual polish — lighting, materials, easing that feels hand-tuned, not default
9. **Single front-loaded wait** — one premium loader while all assets preload, then zero jank forever. Never a mid-experience stutter.

---

## 2. Tech Stack

| Layer            | Choice                                                     | Why                                                                                     |
| ---------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Bundler          | **Vite**                                                   | Fastest HMR, smallest runtime, best for single-page experience                          |
| Framework        | **React 18** + TypeScript                                  | Overlay layer, component composition, type safety                                       |
| 3D               | **three** + **@react-three/fiber** + **@react-three/drei** | Real GPU 3D, declarative, production-proven                                             |
| Smooth scroll    | **lenis**                                                  | Inertial scroll, syncs cleanly with rAF, supports programmatic `scrollTo` with duration |
| State            | **zustand**                                                | One global store, zero boilerplate                                                      |
| Routing          | **react-router-dom** v6                                    | One URL per nav item, browser back/forward for free                                     |
| Debug (dev only) | **leva**                                                   | Live sliders for shader tuning — remove from prod build                                 |
| Content          | **TS module** (`src/content/pages.ts`)                     | Hot-reloadable, typed, editable                                                         |

**Removed from the original plan**: WebM video sequences, Blender asset pipeline, Next.js, SEO prerender, `gsap` (not needed — Lenis's native `scrollTo` with duration gives us the click tween for free).

**SEO**: skipped per decision. If added later, drop in `vite-plugin-ssr` and prerender one route per spread.

---

## 3. Single Source of Truth

One float represents "where we are in the book":

```ts
progress ∈ [0, numSpreads - 1]
spreadIndex  = Math.floor(progress)
foldProgress = progress - spreadIndex   // 0..1 for the currently turning page
```

### Who writes to `progress`

- **Scroll** (Lenis emits scroll events): `progress = scrollTop / window.innerHeight`
- **Click nav**: calls `lenis.scrollTo(target * vh, { duration: 1.2, easing, lock: true })` — Lenis handles the eased scroll animation AND emits scroll events, which automatically update `progress`. One code path.
- **Keyboard ← / →**: same `lenis.scrollTo` call with the current spread ± 1

### Who reads `progress`

- R3F `useFrame` → writes `foldProgress` to the flap material's `uFold` uniform
- DOM overlay layer → page content swap on `spreadIndex` change, fade on `foldProgress`
- Audio → reads `d(progress)/dt` → drives gain + filter frequency

**Critical**: scroll and click cannot desync because they're literally the same code path — click just calls a programmatic scroll, Lenis does the tween, and scroll events update `progress`.

### Edge cases (specified, not assumed)

```ts
// Clamp at boundaries
if (progress < 0) progress = 0;
if (progress >= numSpreads - 1) {
  progress = numSpreads - 1;
  foldProgress = 0; // last spread cannot turn forward
}
```

---

## 4. 3D Scene

### Structure

- `<Canvas>` from R3F, `position: fixed`, full viewport, z-index below the DOM overlay
- `<Book>` component composed of:
  - `<Page side="left">` — static flat plane
  - `<Page side="right">` — static flat plane
  - `<Flap>` — the single actively turning plane, uses the bend material
  - `<Spine>` — thin decorative element at `x = 0`
  - `<ContactShadows>` from drei for ground shadow
- Lighting: `<ambientLight intensity={0.4}>` + `<directionalLight position={[5,10,5]} intensity={0.8} castShadow>` + environment map preset (`<Environment preset="apartment" />` from drei) for PBR reflections
- Camera: `PerspectiveCamera` with a slight top-down tilt (~15°), locked position

### Why only one flap

At any instant only one page is physically mid-turn. All other ~20 pages sit flat. When `spreadIndex` changes, the `<Flap>` component receives new `frontPageId` / `backPageId` props via React — no scene recreation. Scene complexity is constant regardless of total page count.

### The Bend Material — use `onBeforeCompile`, NOT raw `ShaderMaterial`

**Critical implementation note**: a raw `ShaderMaterial` does NOT receive shadows, environment maps, or tone mapping for free. You either reimplement all of those (painful) or use `MeshStandardMaterial` and inject your vertex deformation via `onBeforeCompile`:

```ts
const material = new THREE.MeshStandardMaterial({
  map: frontTexture,
  roughness: 0.9,
  metalness: 0.0,
});

material.onBeforeCompile = (shader) => {
  shader.uniforms.uFold = { value: 0 };
  material.userData.shader = shader; // expose for useFrame updates

  shader.vertexShader = "uniform float uFold;\n" + shader.vertexShader;
  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    `
      #include <begin_vertex>
      float bend = uFold * 3.14159;
      float x = position.x;
      transformed.x = cos(bend) * x;
      transformed.z = sin(bend) * x;
      transformed.z += sin(x * 4.0) * 0.02 * sin(bend);
    `,
  );
};
```

Now the flap inherits shadows, environment reflections, and tone mapping automatically. Update in `useFrame`:

```ts
if (material.userData.shader) {
  material.userData.shader.uniforms.uFold.value = foldProgress;
}
```

### Front/back pages — two back-to-back meshes, not `DoubleSide`

Using `side: DoubleSide` means the fragment shader runs for both faces and you have to flip UVs on the back manually (easy to get wrong, mirrors text). **Simpler**: create two single-sided meshes back-to-back with opposite normals, each with its own `MeshStandardMaterial` and its own texture. Clean separation, no fragment branching.

### Geometry

- `PlaneGeometry(bookWidth / 2, bookHeight, 32, 32)` — 32×32 subdivisions for smooth deformation
- Reuse via `useMemo` — all pages share one geometry instance

### Tune-ables (expose via Leva during dev)

- Curl amplitude (default `0.02`)
- Curl frequency (default `4.0`)
- Subdivisions (32×32 desktop, 16×16 mobile)
- Directional light angle + intensity
- Environment map intensity
- Paper roughness / sheen

**⚠️ Budget**: expect **1–2 full days of shader and lighting tuning**, not instant success. Making "paper" look like paper is taste work that needs a browser + slider, not math alone.

---

## 5. Content Layer

### Content schema

```ts
// src/content/pages.ts
export type Page = {
  id: string;
  title?: string;
  body?: string; // plain text or light HTML
  image?: string; // path under /public
  isCover?: boolean;
  route?: string; // optional — ties this page to a nav URL
};

export const pages: Page[] = [
  { id: "cover", isCover: true, title: "The Book of X", route: "/" },
  { id: "intro", title: "Introduction", body: "..." },
  { id: "syllabus", title: "Syllabus", body: "...", route: "/syllabus" },
  { id: "enroll", title: "Enroll", body: "...", route: "/enroll" },
  // ...up to 25 entries
];
```

Adding a row extends the book automatically. Hot-reloads in dev. No build step for content edits.

### Overlay rendering (the key simplification)

**Text is never bent.** Opacity is `|cos(foldProgress · π)|` — text is 1.0 at rest, fades to 0 by mid-turn, fades back in when the new spread is flat. The overlay NEVER needs to deform — it just matches the **flat-page rectangles** in screen space.

### Computing the flat-page rectangles

Done once at mount and on every window `resize`:

```ts
function computePageRects(leftMesh, rightMesh, camera, canvas) {
  const rects = {};
  for (const [side, mesh] of [
    ["left", leftMesh],
    ["right", rightMesh],
  ]) {
    const box = new THREE.Box3().setFromObject(mesh);
    const corners = [
      new THREE.Vector3(box.min.x, box.max.y, 0),
      new THREE.Vector3(box.max.x, box.max.y, 0),
      new THREE.Vector3(box.max.x, box.min.y, 0),
      new THREE.Vector3(box.min.x, box.min.y, 0),
    ];
    const screen = corners.map((c) => c.project(camera));
    rects[side] = ndcToPixelRect(screen, canvas);
  }
  return rects;
}
```

Written to CSS custom properties (`--left-top`, `--left-left`, `--left-width`, `--left-height`, same for right). No per-frame cost. Recomputed on `resize` only.

### Spread → page-index math (with cover walkthrough)

```ts
idxLeftFlat = spreadIndex * 2 - 1;
idxFlapFront = spreadIndex * 2;
idxFlapBack = spreadIndex * 2 + 1;
idxRightFlat = spreadIndex * 2 + 2;
```

**Spread 0 (book closed, showing cover):**

- `idxLeftFlat = -1` → left slot hidden via `opacity: 0`
- `idxFlapFront = 0` → cover (flap shows cover on the right)
- `idxFlapBack = 1` → first content page (revealed as flap turns)
- `idxRightFlat = 2` → second content page

**Spread 1 (first content spread):**

- `idxLeftFlat = 1` → first content page (now on the left, flat)
- `idxFlapFront = 2` → second content page (flap front)
- `idxFlapBack = 3` → third content page (flap back, not yet seen)
- `idxRightFlat = 4` → fourth content page

**Last spread:**

- If `idxRightFlat >= pages.length`, hide right slot via `opacity: 0`
- Clamp `foldProgress = 0` so flap cannot turn past the end

Implement as a pure derivation helper — the helper returns `undefined` for out-of-range indices and the renderer hides that slot.

---

## 6. Scroll Integration (Lenis)

```ts
// src/lenis.ts
import Lenis from "lenis";

export const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  smoothTouch: false, // touch gets native inertia, don't double it
});

function raf(time: number) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
```

Scroll height is generated by a spacer `<div>` with `height: ${numSpreads * 100}vh` — same trick as the current prototype.

### React strict mode caution

Attach the scroll listener inside a `useEffect` with a cleanup return — otherwise React 18 strict mode's double-mount in dev will register the listener twice and `progress` will update incorrectly.

```ts
useEffect(() => {
  const handler = ({ scroll }) => {
    setProgress(scroll / window.innerHeight);
  };
  lenis.on("scroll", handler);
  return () => lenis.off("scroll", handler);
}, []);
```

---

## 7. Click Navigation

### Navbar

Fixed left sidebar, always visible, outside the Canvas:

```tsx
<nav className="sidebar">
  <NavLink to="/">Home</NavLink>
  <NavLink to="/syllabus">Syllabus</NavLink>
  <NavLink to="/showcase">Showcase</NavLink>
  <NavLink to="/enroll">Enroll</NavLink>
</nav>
```

### The click → animate handler (single code path)

```ts
function animateToSpread(target: number) {
  lenis.scrollTo(target * window.innerHeight, {
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    lock: true, // prevent user scroll from hijacking mid-animation
  });
}
```

That's it. Lenis handles the eased scroll, emits scroll events, which update `progress`, which drives the shader. No separate gsap tween. No dual animation. No desync possible.

React Router listens to `location.pathname` changes and calls `animateToSpread(routeToSpread[pathname])` automatically. Browser back/forward just works.

### Interrupting an in-flight animation

`lenis.scrollTo` with `lock: true` blocks user scroll during the tween. For click-during-click (re-targeting), calling `lenis.scrollTo` again while already animating just redirects to the new target.

---

## 8. Audio (port from current `js/audio.js`)

Same Web Audio graph: white-noise buffer → bandpass filter → gain → destination. The listener reads `progress` velocity inside `useFrame`:

```ts
let lastProgress = 0;
let lastTime = performance.now();

useFrame(() => {
  const progress = useBookStore.getState().progress;
  const now = performance.now();
  const dt = now - lastTime || 1;
  const velocity = Math.abs(progress - lastProgress) / dt;
  updatePaperRustle(velocity);
  lastProgress = progress;
  lastTime = now;
});
```

Click-nav tweens also produce rustle sound because they modify `progress` over time — free side effect of the unified progress model.

First-gesture unlock (`click` / `touchstart`) exactly like the current prototype.

---

## 9. Accessibility

- **`prefers-reduced-motion: reduce`** → disable bend shader entirely (force `uFold = 0`), cross-fade overlay text between spreads over 300ms, disable Lenis smoothing. Book becomes a clean slide-show.
- **Keyboard**: ← / → = prev / next spread, `Home` / `End` = first / last. Same `animateToSpread` code path as click nav.
- **Screen reader**: `aria-live="polite"` region announces new spread title on change. **Do NOT auto-move focus** — that interrupts screen reader flow and fights user intent. Let the user tab to content when they want it.
- **Semantic HTML** in overlay: real `<h1>`, `<p>`, `<img alt>`
- **Deep linking**: each route is a real URL so back/forward and bookmarks work

---

## 10. Performance

### Targets

| Metric                        | Target                                |
| ----------------------------- | ------------------------------------- |
| Frame rate (desktop)          | 60fps steady                          |
| Frame rate (4-year-old phone) | ≥30fps                                |
| First paint                   | <1.5s on 4G                           |
| Bundle (gzipped)              | ≤300KB JS (three.js ~150KB of that)   |
| GPU frame time                | ≤16ms                                 |
| Total image weight            | ≤3MB (all 25 pages preloaded at boot) |

### Preload strategy

Covered in full detail in §11 (Loading Experience). Summary: every asset the user will ever touch is preloaded and GPU-warmed before the book mounts, behind a premium loader. One wait, then zero jank for the rest of the session.

### Other strategies

- Reuse one `PlaneGeometry` instance across all pages (via `useMemo`)
- `<Canvas gl={{ antialias: true, powerPreference: 'high-performance' }} dpr={[1, 2]}>`
- `frameloop="always"` — scroll-linked animation needs every frame
- `will-change: transform` on the DOM overlay text containers
- On mobile: 16×16 plane subdivisions, baked shadow texture instead of `ContactShadows` if profiling shows frame drops

---

## 11. Loading Experience (one wait, premium feel)

**Principle**: pay the entire cost once, upfront, behind a loader that itself builds interest. From that moment on the book must be perfectly smooth — no first-scroll shader compile stall, no texture upload jank, no first-click audio pop.

### What gets preloaded (the full list)

| Asset                                | Why it must load before mount                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| All page hero images (~25)           | Texture upload to GPU before first render                                                              |
| Cover front + back images            | Flap front/back textures for spread 0                                                                  |
| Paper normal map                     | Material needs it compiled in                                                                          |
| HDRI environment map (~500KB)        | `<Environment>` needs this for PBR reflections                                                         |
| Web fonts (Playfair Display + Inter) | Prevent FOUT when overlay text appears                                                                 |
| Shader warmup render                 | Force GLSL compile before user interaction (critical — see below)                                      |
| Audio buffer                         | White noise is synthesized, but the 2s buffer should be built at boot so first scroll doesn't allocate |

### Shader warmup — the non-obvious one

GLSL compilation happens on first draw, not on material construction. If you skip this, the _first_ scroll causes a 40–200ms stall as the shader compiles. **Fix**: after assets load but before the loader fades out, run a hidden throwaway render pass:

```ts
// Force shader compile by rendering the flap once with uFold sweep
flapMaterial.userData.shader.uniforms.uFold.value = 0.5;
renderer.compile(scene, camera); // built-in warmup API
renderer.render(scene, camera); // one real frame to seal the deal
```

Three.js's `renderer.compile()` pre-compiles all programs for a scene. Call it inside the loader flow right before the fade-out.

### Preload sequence (exact order)

```ts
async function bootSequence() {
  setLoaderProgress(0);

  // 1. Fonts (critical for overlay text fidelity)
  await document.fonts.ready;
  setLoaderProgress(0.1);

  // 2. All page images — parallel, track progress
  const images = pages.filter((p) => p.image).map((p) => p.image);
  await preloadImages(images, (done, total) => {
    setLoaderProgress(0.1 + (done / total) * 0.7);
  });

  // 3. HDRI + normal map
  await Promise.all([loadHDRI(), loadNormalMap()]);
  setLoaderProgress(0.9);

  // 4. Mount Canvas invisibly, run shader warmup
  await mountCanvasHidden();
  await warmupShader();
  setLoaderProgress(1.0);

  // 5. Minimum display floor (prevent flash on fast connections)
  await waitUntilMinimumElapsed(1200); // 1.2s floor

  // 6. Fade loader out, fade book in
  await fadeLoaderOut(600);
}
```

`preloadImages` uses `new Image()` + `img.decode()` so textures are fully decoded before Three.js uploads them. Progress callback drives the UI.

### Minimum display floor

On fast connections boot may finish in 200ms. Flashing a loader that fast feels broken. Enforce a **1.2s minimum display time** — if loading finishes earlier, wait. This gives the brand a moment and makes the transition feel intentional.

### Visual design of the loader

The loader is the user's _first_ impression. Make it feel like the book itself, not a generic spinner.

**Layout**:

- Same warm background (`#f0ebe1`) as the main site — no color flash on transition
- Centered vertically + horizontally
- Playfair Display for the brand mark, Inter for sub-text

**The loading motif — a book that's "being made"**:

- Center: a small closed book silhouette (~80×100px), drawn in SVG with a warm cream fill and thin dark stroke
- A single page visibly flutters out from the right side and settles back in, on a 2.4s loop — same curl feeling as the real book, hints at what's coming
- Below: the brand name in Playfair Display, letter-spacing wide, subtle
- Below that: a thin horizontal progress bar (1px tall, 240px wide, warm gold fill) that fills left→right as `loaderProgress` advances
- Below the bar: tiny italic text that cycles through phrases synced to progress:
  - 0–30%: "Binding the pages…"
  - 30–70%: "Inking the illustrations…"
  - 70–95%: "Warming the light…"
  - 95–100%: "Opening the cover…"

**Motion**:

- Page flutter: CSS `@keyframes` on the SVG page element, `transform-origin: left center`, rotate 0° → -40° → 0° with eased curve, 2.4s loop, subtle shadow that follows
- Progress bar: transitions via `width` driven by React state, `transition: width 200ms ease-out`
- Brand text: fades in over 400ms on mount
- Whole loader: on complete, scales up 1.0 → 1.02 and fades to 0 over 600ms; at the same time the book scene fades from 0 → 1 over 600ms (crossfade)

**Do NOT**:

- Use a generic spinner — feels cheap
- Use percentage numbers — bar + phrase is enough and feels less "loading screen"
- Play audio on the loader — audio unlocks on first post-loader gesture only
- Animate anything 3D in the loader — keep it flat 2D so it's instant

### Loader component structure

```
src/components/LoadingScreen.tsx
  - useLoaderProgress()            — subscribes to zustand loader slice
  - <BookSilhouette>               — SVG book, flutter animation
  - <BrandMark>                    — Playfair display text
  - <ProgressBar progress={p} />
  - <FlavorText progress={p} />    — cycles phrases
```

Full CSS in `LoadingScreen.module.css` — scoped, no global pollution.

### Reduced motion on the loader

If `prefers-reduced-motion: reduce`:

- Kill the page flutter animation — show a static book icon
- Keep the progress bar (it's informational, not decorative)
- Crossfade to book over 300ms instead of 600ms

### Accessibility

- `role="status"` `aria-live="polite"` on the loader root
- The flavor text changes are announced automatically
- Progress bar has `role="progressbar"` + `aria-valuenow`
- Loader traps focus until complete so Tab can't land on hidden book nav

### Failure mode

If an asset fails to load (network drop, 404), the preloader logs the error, substitutes a fallback (plain colored page for missing image), and continues — loader never hangs forever. Hard cutoff at 20 seconds even if everything stalls: log, continue, show whatever loaded.

---

## 12. Visual Polish (the "does it look good" phase)

Smoothness is guaranteed by the architecture. **Beauty is a dedicated polish phase.** These are taste decisions tuned in the browser, not math:

- **Environment map**: drei `<Environment preset="apartment" />` or a custom HDRI for warm indoor ambient
- **Tone mapping**: `ACESFilmicToneMapping` on the WebGLRenderer, exposure ~1.0
- **Paper material**: subtle normal map texture for fiber, `roughness: 0.9`, `metalness: 0`, optional sheen for fabric cover
- **Shadows**: contact shadow blur ~2.0, opacity ~0.4, resolution 1024
- **Easing curves**: Lenis `duration: 1.2` with the expo-out easing in the plan; tune to match the page-turn sound timing
- **Page-turn rustle SFX**: max gain at mid-turn, not at start
- **Background**: warm neutral (#f0ebe1 matches current prototype), no gradient
- **Typography**: keep Playfair Display + Inter from current prototype
- **Loading screen**: designed in full in §11 — polished here alongside the book

**⚠️ Budget**: 2–3 days for the polish pass. Skipping this is the single biggest risk to "it doesn't look as good as we wanted."

---

## 13. File Structure

```
src/
  main.tsx
  App.tsx                 — router + layout shell
  store.ts                — zustand store (progress, spreadIndex, isAnimating)
  lenis.ts                — Lenis instance + rAF loop
  hooks/
    useProgressSync.ts    — binds scroll + route changes to progress
    useBookRect.ts        — computes flat-page screen rectangles
    useBootSequence.ts    — full preload pipeline (fonts, images, HDRI, shader warmup)
  content/
    pages.ts              — editable content array
  components/
    Navbar.tsx
    LoadingScreen/
      index.tsx           — loader container, subscribes to boot progress
      BookSilhouette.tsx  — SVG book with flutter animation
      BrandMark.tsx       — Playfair display brand text
      ProgressBar.tsx     — thin animated progress bar
      FlavorText.tsx      — cycling phrases
      LoadingScreen.module.css
    Book/
      BookCanvas.tsx      — <Canvas> + scene setup
      Book.tsx            — book mesh composition
      Page.tsx            — static flat plane
      Flap.tsx            — bending plane with onBeforeCompile material
      Spine.tsx
    Overlay/
      BookOverlay.tsx     — DOM text layer
      PageContent.tsx     — renders one page's HTML
  audio/
    paperRustle.ts        — port of current audio.js
public/
  images/                 — page imagery (preloaded at boot)
```

---

## 14. Build Sequence

Strict order — each step unblocks the next:

1. **Scaffold**: Vite + React + TS, install three / R3F / drei / lenis / zustand / react-router / leva
2. **Store + Lenis**: zustand store with `progress` + boot progress slice, Lenis wired inside a `useEffect`
3. **Canvas + flat plane**: R3F Canvas renders one static plane, camera positioned, environment + directional light
4. **Bend material**: `MeshStandardMaterial` + `onBeforeCompile`, drive `uFold` with a Leva slider (no scroll yet)
5. **Hook progress → shader**: flap's `uFold = foldProgress`, verify scrubbing via scroll
6. **Book composition**: left + right static pages + flap (two back-to-back meshes) + spine + contact shadows
7. **Cover walkthrough**: verify spread 0 hides left slot, flap shows cover front, first turn reveals first content page
8. **Content schema + overlay**: `pages.ts`, compute flat-page rects, opacity fade formula, verify text swaps at spread boundary
9. **Loading screen (visual)**: build `<LoadingScreen>` component standalone with SVG book flutter, brand mark, progress bar, flavor text. Mount it on its own route for iteration.
10. **Boot sequence wiring**: `useBootSequence` hook runs fonts → images → HDRI → Canvas mount → `renderer.compile()` → shader warmup → 1.2s min floor → crossfade. Book mounts only after.
11. **Router + navbar + click-to-animate**: `lenis.scrollTo` with `lock: true`, verify parity with scroll
12. **Keyboard + reduced-motion fallback** (including loader reduced-motion variant)
13. **Audio**: port paperRustle synth, hook to `progress` velocity in useFrame
14. **Mobile profiling**: real device test, drop to 16×16 subdivisions + baked shadows if needed
15. **Visual polish pass**: lighting, materials, tone mapping, easing curves, shader tuning, loader motion tuning (2–3 days)

---

## 15. Risks & Mitigations

| Risk                                                    | Severity | Mitigation                                                                           |
| ------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| Raw `ShaderMaterial` doesn't receive shadows / env map  | **HIGH** | Use `MeshStandardMaterial` + `onBeforeCompile` (specified in §4)                     |
| Shader first-compile stalls first scroll by 40–200ms    | **HIGH** | `renderer.compile()` + warmup frame inside boot sequence (§11)                       |
| Shader tuning takes longer than expected                | **HIGH** | Budget 1–2 days explicitly in §4 and §14                                             |
| Visual polish skipped → "doesn't look good"             | **HIGH** | Dedicated polish phase in §12 and §14, not an afterthought                           |
| Loader looks generic / cheap → bad first impression     | **HIGH** | Full loader design in §11; iterate standalone before wiring                          |
| Page curl clips through adjacent meshes at high `uFold` | MEDIUM   | Tune curl coefficient with Leva slider; clamp if needed                              |
| DOM overlay drifts off the 3D book rect on resize       | MEDIUM   | Recompute on `resize` event, write to CSS vars, cached                               |
| Cover / last-spread edge cases off-by-one               | MEDIUM   | §5 walkthrough — test both explicitly before moving on                               |
| React 18 strict mode double-mounts Lenis listener       | MEDIUM   | Attach inside `useEffect` with cleanup (§6)                                          |
| Touch feel differs from desktop wheel                   | MEDIUM   | Test on real iOS + Android early; `smoothTouch: false` lets native inertia handle it |
| Mobile GPU can't hit 30fps with real shadows            | MEDIUM   | Fallback to baked shadow texture + 16×16 subdivisions                                |
| Loader flashes on fast connections                      | MEDIUM   | 1.2s minimum display floor (§11)                                                     |
| An asset 404s and loader hangs                          | MEDIUM   | Fallback + 20s hard cutoff (§11)                                                     |
| UV flip missed on back face → mirrored text             | LOW      | Use two back-to-back single-sided meshes instead of `DoubleSide` (§4)                |
| Scroll + click-nav collision (user scrolls mid-tween)   | LOW      | `lenis.scrollTo({ lock: true })`                                                     |
| HMR of `pages.ts` breaks state mid-turn                 | LOW      | On HMR, reset `progress` to `Math.round(progress)` (clean spread boundary)           |

---

## 16. Assets Checklist (before coding starts)

- [ ] Closed front cover image (flat straight-on view, no 3D perspective)
- [ ] Back cover image
- [ ] Per-page hero images (25 max, ~800×1000px WebP, ~100KB each)
- [ ] Paper normal map (fine fiber texture, tileable)
- [ ] Optional: HDRI environment map for warm indoor lighting
- [ ] Favicon

All page-face images should be **flat product shots** (no isometric, no 3D tilt) — the 3D curl is done at runtime by the shader; images are just textures on flat page faces.

---

## 17. What This Plan Does NOT Cover (honest scope)

- **Backend / forms / enrollment data**: the `Enroll` route currently assumes a static form. Real submission needs a backend (not in scope).
- **CMS**: content lives in a TS file. For non-developer editing, a headless CMS layer would need to be added later.
- **Analytics / tracking**: not specified. Add your preferred tool at the router level.
- **Internationalization**: single language only.
- **SEO prerender**: explicitly skipped. Add `vite-plugin-ssr` later if needed.

---

## Summary — Will this give the smooth, good-looking website you want?

**Yes — conditionally:**

- **Smoothness**: ✅ architecturally guaranteed. Lenis + GPU shader + unified progress model + shader warmup = 60fps from the first frame, no desync, no first-scroll stall.
- **One-time wait, then zero jank**: ✅ boot sequence in §11 preloads every asset, warms the shader, and crossfades into the book — the user waits once behind a premium loader and never waits again.
- **Premium loader**: ✅ designed in full in §11 — book silhouette with page flutter, brand mark, progress bar, cycling flavor text. Budgeted in the polish phase.
- **Look & feel**: ✅ achievable but NOT automatic. Budget 2–3 days for the visual polish phase (§12). Skipping it is the #1 risk to "it doesn't look as premium as I hoped."
- **Easy text editing**: ✅ one TS file, hot reload, no build.
- **Easy page add/remove**: ✅ add a row to the array.
- **Real page curl**: ✅ but expect 1–2 days of shader tuning in the browser.
