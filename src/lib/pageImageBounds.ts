import type { Page } from "../content/pages";

/**
 * Reference texture size used in usePageTexture (high tier). Layout uses fixed PADDING
 * pixels so UV fractions are ~consistent across quality tiers.
 */
const REF_TEX_W = 1024;
const REF_TEX_H = 1400;
const PADDING = 100;

const PAD_U = PADDING / REF_TEX_W;
/** Inner pages: illustration band (from usePageTexture). */
const IMG_TOP_FRAC = 0.56;
const IMG_H_FRAC = 0.3;

/** Technical diagram: approximate UV box matching renderPageToCanvas layout. */
const TECH_MARGIN_U = (PADDING * 0.55) / REF_TEX_W;
const TECH_TITLE_FRAC = 0.052;
const TECH_TITLE_LINES_FRAC = (48 * 1.18 * 1.2) / REF_TEX_H;
const TECH_GAP_FRAC = 0.022;
const TECH_BOTTOM_FRAC = (PADDING * 0.65) / REF_TEX_H;

export type ImageUvBounds = { uMin: number; uMax: number; vMin: number; vMax: number };

export function pageHasInspectableImage(page: Page | undefined): page is Page {
  if (!page?.image) return false;
  if (page.isCover || page.isFormPage) return false;
  return true;
}

/** Geometry UV bounds (Three.js plane: u along local X, v along local Y; v=0 mesh bottom). */
export function getPageImageUvBounds(page: Page | undefined): ImageUvBounds | null {
  if (!pageHasInspectableImage(page)) return null;

  if (page.id === "technical") {
    const uMin = TECH_MARGIN_U;
    const uMax = 1 - TECH_MARGIN_U;
    const topT = TECH_TITLE_FRAC + TECH_TITLE_LINES_FRAC + TECH_GAP_FRAC;
    const bottomT = 1 - TECH_BOTTOM_FRAC;
    const vTop = 1 - topT;
    const vBot = 1 - bottomT;
    return { uMin, uMax, vMin: Math.min(vBot, vTop), vMax: Math.max(vBot, vTop) };
  }

  const uMin = PAD_U;
  const uMax = 1 - PAD_U;
  const tTop = IMG_TOP_FRAC;
  const tBot = IMG_TOP_FRAC + IMG_H_FRAC;
  const vTop = 1 - tTop;
  const vBot = 1 - tBot;
  return { uMin, uMax, vMin: Math.min(vBot, vTop), vMax: Math.max(vBot, vTop) };
}

export function uvInImageBounds(uv: { x: number; y: number }, b: ImageUvBounds): boolean {
  const u = uv.x;
  const v = uv.y;
  return u >= b.uMin && u <= b.uMax && v >= b.vMin && v <= b.vMax;
}
