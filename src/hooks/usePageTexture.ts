import * as THREE from "three";
import { pages as allPages, type Page } from "../content/pages";
import { getBookQualityTier } from "./useBookQuality";

function getTexDimensions(): { w: number; h: number } {
  const tier = typeof window === "undefined" ? "high" : getBookQualityTier();
  if (tier === "high") return { w: 1024, h: 1400 };
  if (tier === "medium") return { w: 896, h: 1225 };
  return { w: 768, h: 1050 };
}

let TEX_WIDTH = 1024;
let TEX_HEIGHT = 1400;
const PADDING = 100;

const PAPER_COLOR = "#FDFBF7";
const COVER_COLOR = "#2b303a";
/**
 * Front/back cover hero art only (not inner pages or the technical diagram).
 * Asset: public/images/cover-image.png → URL path below.
 */
const COVER_ART_SRC = "/images/cover-image.png";
const TEXT_COLOR = "#333333";
const COVER_TEXT_COLOR = "#e8dcc5";

// ===== Image loading =====
const imageCache = new Map<string, HTMLImageElement>();
const imagePromises = new Map<string, Promise<HTMLImageElement>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  if (imagePromises.has(src)) return imagePromises.get(src)!;
  const promise = new Promise<HTMLImageElement>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => resolve(img);
    img.src = src;
  });
  imagePromises.set(src, promise);
  return promise;
}

// ===== Pre-rendered texture cache =====
const textureCache = new Map<string, THREE.CanvasTexture>();
let allTexturesReady = false;
let texturesReadyPromise: Promise<void> | null = null;

function wrapTextLineBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  let currentY = y;
  for (const word of words) {
    const testLine = line + word + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line !== "") {
      ctx.fillText(line.trim(), x, currentY);
      line = word + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim().length > 0) {
    ctx.fillText(line.trim(), x, currentY);
  }
  return currentY + lineHeight;
}

function fillTextEllipsis(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
  const ell = "\u2026";
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const slice = text.slice(0, mid).trimEnd() + ell;
    if (ctx.measureText(slice).width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  ctx.fillText(text.slice(0, lo).trimEnd() + ell, x, y);
}

/** Word-wrap one block; stops with ellipsis when baseline would exceed maxBaselineY. */
function wrapTextLineBlockWithClamp(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxBaselineY: number,
): { nextY: number; truncated: boolean } {
  const words = text.split(/\s+/).filter(Boolean);
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line + word + " ";
    if (ctx.measureText(testLine).width > maxWidth && line !== "") {
      if (currentY > maxBaselineY) {
        fillTextEllipsis(ctx, line.trim(), x, maxBaselineY, maxWidth);
        return { nextY: maxBaselineY + lineHeight, truncated: true };
      }
      ctx.fillText(line.trim(), x, currentY);
      line = word + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim().length > 0) {
    if (currentY > maxBaselineY) {
      fillTextEllipsis(ctx, line.trim(), x, maxBaselineY, maxWidth);
      return { nextY: maxBaselineY + lineHeight, truncated: true };
    }
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  return { nextY: currentY, truncated: false };
}

function measureFullParagraphHeight(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
  paragraphSpacing: number,
): number {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  let currentY = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    const lines = paragraphs[i]
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    for (const ln of lines) {
      const words = ln.split(/\s+/).filter(Boolean);
      let line = "";
      for (const word of words) {
        const testLine = line + word + " ";
        if (ctx.measureText(testLine).width > maxWidth && line !== "") {
          currentY += lineHeight;
          line = word + " ";
        } else {
          line = testLine;
        }
      }
      if (line.trim().length > 0) {
        currentY += lineHeight;
      }
    }
    if (i < paragraphs.length - 1) {
      currentY += paragraphSpacing;
    }
  }
  return currentY;
}

function drawParagraphText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  paragraphSpacing: number,
  clampBottomY?: number,
): { finalY: number; truncated: boolean } {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  let currentY = y;
  const maxBaselineY =
    clampBottomY !== undefined ? clampBottomY : Number.POSITIVE_INFINITY;

  for (let i = 0; i < paragraphs.length; i++) {
    const lines = paragraphs[i]
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    for (const ln of lines) {
      if (clampBottomY !== undefined) {
        const { nextY, truncated } = wrapTextLineBlockWithClamp(
          ctx,
          ln,
          x,
          currentY,
          maxWidth,
          lineHeight,
          maxBaselineY,
        );
        currentY = nextY;
        if (truncated) {
          return { finalY: currentY, truncated: true };
        }
      } else {
        currentY = wrapTextLineBlock(ctx, ln, x, currentY, maxWidth, lineHeight);
      }
    }
    if (i < paragraphs.length - 1) {
      currentY += paragraphSpacing;
      if (clampBottomY !== undefined && currentY > clampBottomY) {
        return { finalY: clampBottomY, truncated: true };
      }
    }
  }

  return { finalY: currentY, truncated: false };
}

function renderPageToCanvas(page: Page | undefined): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_WIDTH;
  canvas.height = TEX_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  if (!page || page.isFormPage) {
    ctx.fillStyle = PAPER_COLOR;
    ctx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);
    return canvas;
  }

  // Back cover outside
  if (page.isBackCoverOutside) {
    const coverImg = imageCache.get(COVER_ART_SRC);
    if (coverImg && coverImg.complete && coverImg.naturalWidth > 0) {
      const imgAspect = coverImg.naturalWidth / coverImg.naturalHeight;
      const canvasAspect = TEX_WIDTH / TEX_HEIGHT;
      let sx = 0,
        sy = 0,
        sw = coverImg.naturalWidth,
        sh = coverImg.naturalHeight;
      if (imgAspect > canvasAspect) {
        sw = coverImg.naturalHeight * canvasAspect;
        sx = (coverImg.naturalWidth - sw) / 2;
      } else {
        sh = coverImg.naturalWidth / canvasAspect;
        sy = (coverImg.naturalHeight - sh) / 2;
      }
      ctx.drawImage(coverImg, sx, sy, sw, sh, 0, 0, TEX_WIDTH, TEX_HEIGHT);
    } else {
      ctx.fillStyle = COVER_COLOR;
      ctx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);
    }

    const vignette = ctx.createRadialGradient(
      TEX_WIDTH / 2,
      TEX_HEIGHT / 2,
      TEX_HEIGHT * 0.3,
      TEX_WIDTH / 2,
      TEX_HEIGHT / 2,
      TEX_HEIGHT * 0.7,
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.15)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);

    if (page.title) {
      ctx.font = `bold 42px 'Playfair Display', serif`;
      ctx.fillStyle = COVER_TEXT_COLOR;
      ctx.globalAlpha = 0.7;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(page.title, TEX_WIDTH / 2, TEX_HEIGHT * 0.15);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = "rgba(232, 220, 197, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(TEX_WIDTH * 0.3, TEX_HEIGHT * 0.22);
      ctx.lineTo(TEX_WIDTH * 0.7, TEX_HEIGHT * 0.22);
      ctx.stroke();
    }

    if (page.body) {
      ctx.font = `italic 22px 'Inter', sans-serif`;
      ctx.fillStyle = COVER_TEXT_COLOR;
      ctx.globalAlpha = 0.5;
      ctx.textAlign = "center";
      void drawParagraphText(
        ctx,
        page.body,
        TEX_WIDTH / 2,
        TEX_HEIGHT * 0.35,
        TEX_WIDTH * 0.7,
        36,
        16,
      );
      ctx.globalAlpha = 1;
    }

    ctx.font = `300 16px 'Inter', sans-serif`;
    ctx.fillStyle = COVER_TEXT_COLOR;
    ctx.globalAlpha = 0.3;
    ctx.textAlign = "center";
    ctx.fillText("FIRST EDITION \u00B7 2026", TEX_WIDTH / 2, TEX_HEIGHT * 0.88);
    ctx.globalAlpha = 1;

    return canvas;
  }

  // Diagram-only spread: title + full-bleed flow chart (no body, no page number)
  if (page.id === "technical") {
    ctx.fillStyle = PAPER_COLOR;
    ctx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);

    const spineGrad = ctx.createLinearGradient(0, 0, 80, 0);
    spineGrad.addColorStop(0, "rgba(0,0,0,0.08)");
    spineGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = spineGrad;
    ctx.fillRect(0, 0, 80, TEX_HEIGHT);

    const rightEdge = ctx.createLinearGradient(TEX_WIDTH - 30, 0, TEX_WIDTH, 0);
    rightEdge.addColorStop(0, "rgba(0,0,0,0)");
    rightEdge.addColorStop(1, "rgba(0,0,0,0.03)");
    ctx.fillStyle = rightEdge;
    ctx.fillRect(TEX_WIDTH - 30, 0, 30, TEX_HEIGHT);

    const marginX = PADDING * 0.55;
    const titleTop = TEX_HEIGHT * 0.052;
    let contentTop = titleTop;

    if (page.title) {
      ctx.font = `bold 48px 'Playfair Display', serif`;
      ctx.fillStyle = TEXT_COLOR;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const titleMaxW = TEX_WIDTH - marginX * 2;
      contentTop = wrapTextLineBlock(
        ctx,
        page.title,
        TEX_WIDTH / 2,
        titleTop,
        titleMaxW,
        48 * 1.18,
      );
      contentTop += TEX_HEIGHT * 0.022;
    }

    const diagramSrc = page.image ?? "/images/generated/full_flow.png";
    const pageImg = imageCache.get(diagramSrc);
    const marginBottom = PADDING * 0.65;
    const availW = TEX_WIDTH - marginX * 2;
    const availH = TEX_HEIGHT - contentTop - marginBottom;

    if (pageImg && pageImg.complete && pageImg.naturalWidth > 0 && availH > 32 && availW > 32) {
      const ar = pageImg.naturalWidth / pageImg.naturalHeight;
      const boxAr = availW / availH;
      let dw: number;
      let dh: number;
      if (ar > boxAr) {
        dw = availW;
        dh = availW / ar;
      } else {
        dh = availH;
        dw = availH * ar;
      }
      const dx = marginX + (availW - dw) / 2;
      const dy = contentTop + (availH - dh) / 2;
      ctx.drawImage(pageImg, dx, dy, dw, dh);
    }

    return canvas;
  }

  const isCover = page.isCover;

  // Front cover
  if (isCover) {
    const coverImg = imageCache.get(COVER_ART_SRC);
    if (coverImg && coverImg.complete && coverImg.naturalWidth > 0) {
      const imgAspect = coverImg.naturalWidth / coverImg.naturalHeight;
      const canvasAspect = TEX_WIDTH / TEX_HEIGHT;
      let sx = 0,
        sy = 0,
        sw = coverImg.naturalWidth,
        sh = coverImg.naturalHeight;
      if (imgAspect > canvasAspect) {
        sw = coverImg.naturalHeight * canvasAspect;
        sx = (coverImg.naturalWidth - sw) / 2;
      } else {
        sh = coverImg.naturalWidth / canvasAspect;
        sy = (coverImg.naturalHeight - sh) / 2;
      }
      ctx.drawImage(coverImg, sx, sy, sw, sh, 0, 0, TEX_WIDTH, TEX_HEIGHT);

      const topShadow = ctx.createLinearGradient(0, 0, 0, 40);
      topShadow.addColorStop(0, "rgba(0,0,0,0.2)");
      topShadow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = topShadow;
      ctx.fillRect(0, 0, TEX_WIDTH, 40);

      const bottomShadow = ctx.createLinearGradient(
        0,
        TEX_HEIGHT - 40,
        0,
        TEX_HEIGHT,
      );
      bottomShadow.addColorStop(0, "rgba(0,0,0,0)");
      bottomShadow.addColorStop(1, "rgba(0,0,0,0.15)");
      ctx.fillStyle = bottomShadow;
      ctx.fillRect(0, TEX_HEIGHT - 40, TEX_WIDTH, 40);

      const spineShadow = ctx.createLinearGradient(0, 0, 50, 0);
      spineShadow.addColorStop(0, "rgba(0,0,0,0.25)");
      spineShadow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = spineShadow;
      ctx.fillRect(0, 0, 50, TEX_HEIGHT);
    } else {
      ctx.fillStyle = COVER_COLOR;
      ctx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);
    }
  } else {
    ctx.fillStyle = PAPER_COLOR;
    ctx.fillRect(0, 0, TEX_WIDTH, TEX_HEIGHT);
  }

  // Spine shadow for inner pages
  if (!isCover) {
    const gradient = ctx.createLinearGradient(0, 0, 80, 0);
    gradient.addColorStop(0, "rgba(0,0,0,0.08)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 80, TEX_HEIGHT);

    const rightEdge = ctx.createLinearGradient(TEX_WIDTH - 30, 0, TEX_WIDTH, 0);
    rightEdge.addColorStop(0, "rgba(0,0,0,0)");
    rightEdge.addColorStop(1, "rgba(0,0,0,0.03)");
    ctx.fillStyle = rightEdge;
    ctx.fillRect(TEX_WIDTH - 30, 0, 30, TEX_HEIGHT);
  }

  const textColor = isCover ? COVER_TEXT_COLOR : TEXT_COLOR;
  const textX = isCover ? TEX_WIDTH / 2 : PADDING;
  const maxWidth = TEX_WIDTH - PADDING * 2;

  let currentY = isCover ? TEX_HEIGHT * 0.35 : TEX_HEIGHT * 0.18;

  if (page.title) {
    const fontSize = isCover ? 72 : 56;
    ctx.font = `bold ${fontSize}px 'Playfair Display', serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = isCover ? "center" : "left";
    ctx.textBaseline = "top";
    currentY = wrapTextLineBlock(
      ctx,
      page.title,
      textX,
      currentY,
      maxWidth,
      fontSize * 1.2,
    );
    currentY += 30;
  }

  const imageTopY = TEX_HEIGHT * 0.56;
  const bodyClampBottom = imageTopY - 36;
  /** Reserve space below body for optional “(continued)” cue when truncated. */
  const bodyMaxBaseline = bodyClampBottom - 26;

  if (page.body) {
    const paragraphSpacing = isCover ? 14 : 20;
    let fontSize = isCover ? 26 : 27;
    let lineHeight = isCover ? fontSize * 1.7 : fontSize * 1.58;

    if (!isCover) {
      const maxBodyPx = bodyMaxBaseline - currentY;
      let picked = 27;
      for (const fs of [27, 25, 23, 21]) {
        ctx.font = `${fs}px 'Inter', sans-serif`;
        const lh = fs * 1.58;
        const h = measureFullParagraphHeight(
          ctx,
          page.body,
          maxWidth,
          lh,
          paragraphSpacing,
        );
        if (h <= maxBodyPx) {
          picked = fs;
          break;
        }
        picked = fs;
      }
      fontSize = picked;
      lineHeight = fontSize * 1.58;
    }

    ctx.font = `${isCover ? "italic " : ""}${fontSize}px 'Inter', sans-serif`;
    ctx.fillStyle = textColor;
    ctx.globalAlpha = isCover ? 0.85 : 0.88;
    ctx.textAlign = isCover ? "center" : "left";

    if (isCover) {
      void drawParagraphText(
        ctx,
        page.body,
        textX,
        currentY,
        maxWidth,
        lineHeight,
        paragraphSpacing,
        undefined,
      );
      ctx.globalAlpha = 1;
    } else {
      const bodyDraw = drawParagraphText(
        ctx,
        page.body,
        textX,
        currentY,
        maxWidth,
        lineHeight,
        paragraphSpacing,
        bodyMaxBaseline,
      );
      ctx.globalAlpha = 1;
      if (bodyDraw.truncated) {
        ctx.font = `italic 14px 'Inter', sans-serif`;
        ctx.fillStyle = textColor;
        ctx.globalAlpha = 0.52;
        ctx.textAlign = "left";
        ctx.fillText("(continued)", textX, bodyClampBottom - 8);
        ctx.globalAlpha = 1;
      }
    }
  }

  // Page image
  if (!isCover && page.image) {
    const pageImg = imageCache.get(page.image);
    if (pageImg && pageImg.complete && pageImg.naturalWidth > 0) {
      const imgPadding = PADDING;
      const imgWidth = TEX_WIDTH - imgPadding * 2;
      const imgHeight = TEX_HEIGHT * 0.3;
      const imgY = imageTopY;

      const imgAspect = pageImg.naturalWidth / pageImg.naturalHeight;
      const boxAspect = imgWidth / imgHeight;
      let sx = 0,
        sy = 0,
        sw = pageImg.naturalWidth,
        sh = pageImg.naturalHeight;
      if (imgAspect > boxAspect) {
        sw = pageImg.naturalHeight * boxAspect;
        sx = (pageImg.naturalWidth - sw) / 2;
      } else {
        sh = pageImg.naturalWidth / boxAspect;
        sy = (pageImg.naturalHeight - sh) / 2;
      }

      ctx.save();
      ctx.beginPath();
      const r = 8;
      ctx.moveTo(imgPadding + r, imgY);
      ctx.arcTo(
        imgPadding + imgWidth,
        imgY,
        imgPadding + imgWidth,
        imgY + imgHeight,
        r,
      );
      ctx.arcTo(
        imgPadding + imgWidth,
        imgY + imgHeight,
        imgPadding,
        imgY + imgHeight,
        r,
      );
      ctx.arcTo(imgPadding, imgY + imgHeight, imgPadding, imgY, r);
      ctx.arcTo(imgPadding, imgY, imgPadding + imgWidth, imgY, r);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        pageImg,
        sx,
        sy,
        sw,
        sh,
        imgPadding,
        imgY,
        imgWidth,
        imgHeight,
      );
      ctx.restore();

      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(imgPadding + r, imgY);
      ctx.arcTo(
        imgPadding + imgWidth,
        imgY,
        imgPadding + imgWidth,
        imgY + imgHeight,
        r,
      );
      ctx.arcTo(
        imgPadding + imgWidth,
        imgY + imgHeight,
        imgPadding,
        imgY + imgHeight,
        r,
      );
      ctx.arcTo(imgPadding, imgY + imgHeight, imgPadding, imgY, r);
      ctx.arcTo(imgPadding, imgY, imgPadding + imgWidth, imgY, r);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // Page number
  if (!isCover) {
    const pageIndex = allPages.indexOf(page);
    if (pageIndex > 0) {
      ctx.font = "18px Inter, sans-serif";
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.textAlign = "center";
      ctx.fillText(`${pageIndex}`, TEX_WIDTH / 2, TEX_HEIGHT - 50);
    }
  }

  return canvas;
}

// ===== Pre-render all textures =====
export async function preRenderAllTextures(): Promise<void> {
  if (texturesReadyPromise) return texturesReadyPromise;

  texturesReadyPromise = (async () => {
    const dim = getTexDimensions();
    TEX_WIDTH = dim.w;
    TEX_HEIGHT = dim.h;

    // 1. Load all images first
    const imageSrcs = new Set<string>();
    imageSrcs.add(COVER_ART_SRC);
    allPages.forEach((p) => {
      if (p.image) imageSrcs.add(p.image);
    });

    await Promise.all([...imageSrcs].map(loadImage));
    await document.fonts.ready;

    // 2. Render every page to a cached texture
    allPages.forEach((page) => {
      const canvas = renderPageToCanvas(page);
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = true;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      textureCache.set(page.id, tex);
    });

    // Also render an empty page texture
    const emptyCanvas = renderPageToCanvas(undefined);
    const emptyTex = new THREE.CanvasTexture(emptyCanvas);
    emptyTex.colorSpace = THREE.SRGBColorSpace;
    emptyTex.flipY = true;
    emptyTex.minFilter = THREE.LinearFilter;
    emptyTex.magFilter = THREE.LinearFilter;
    emptyTex.needsUpdate = true;
    textureCache.set("__empty__", emptyTex);

    allTexturesReady = true;
  })();

  return texturesReadyPromise;
}

// ===== Hook — just returns cached texture, zero delay =====
export function usePageTexture(
  page: Page | undefined,
): THREE.CanvasTexture | null {
  if (!allTexturesReady) return null;
  if (!page) return textureCache.get("__empty__") ?? null;
  return textureCache.get(page.id) ?? null;
}
