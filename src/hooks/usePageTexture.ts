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
/** Front/back cover hero art (was cover-front.png; use a shipped asset under public/). */
const COVER_ART_SRC = "/images/cover-front.png";
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

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(" ");
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
  ctx.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
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
      wrapText(
        ctx,
        page.body,
        TEX_WIDTH / 2,
        TEX_HEIGHT * 0.35,
        TEX_WIDTH * 0.7,
        36,
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

  let currentY = isCover ? TEX_HEIGHT * 0.35 : TEX_HEIGHT * 0.3;

  if (page.title) {
    const fontSize = isCover ? 72 : 56;
    ctx.font = `bold ${fontSize}px 'Playfair Display', serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = isCover ? "center" : "left";
    ctx.textBaseline = "top";
    currentY = wrapText(
      ctx,
      page.title,
      textX,
      currentY,
      maxWidth,
      fontSize * 1.2,
    );
    currentY += 30;
  }

  if (page.body) {
    const fontSize = isCover ? 26 : 24;
    ctx.font = `${isCover ? "italic " : ""}${fontSize}px 'Inter', sans-serif`;
    ctx.fillStyle = textColor;
    ctx.globalAlpha = isCover ? 0.85 : 0.7;
    ctx.textAlign = isCover ? "center" : "left";
    wrapText(ctx, page.body, textX, currentY, maxWidth, fontSize * 1.7);
    ctx.globalAlpha = 1;
  }

  // Page image
  if (!isCover && page.image) {
    const pageImg = imageCache.get(page.image);
    if (pageImg && pageImg.complete && pageImg.naturalWidth > 0) {
      const imgPadding = PADDING;
      const imgWidth = TEX_WIDTH - imgPadding * 2;
      const imgHeight = TEX_HEIGHT * 0.3;
      const imgY = TEX_HEIGHT * 0.58;

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
