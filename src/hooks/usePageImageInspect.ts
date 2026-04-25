import { useCallback, useEffect, useMemo, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Page } from "../content/pages";
import {
  getPageImageUvBounds,
  pageHasInspectableImage,
  uvInImageBounds,
} from "../lib/pageImageBounds";
import { inspectPickAllowed, type InspectPickKind } from "../lib/bookInspectPick";
import { useBookStore } from "../store";

export function usePageImageInspectHandlers(
  page: Page | undefined,
  pageWidth: number,
  bookHeight: number,
  pickKind: InspectPickKind,
) {
  const modalOpen = useBookStore((s) => s.imageInspect.open);
  const [showZoomHint, setShowZoomHint] = useState(false);
  const bounds = useMemo(() => getPageImageUvBounds(page), [page]);

  useEffect(() => {
    if (!modalOpen) return;
    document.body.style.cursor = "default";
  }, [modalOpen]);

  const onPointerMove = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (modalOpen || !bounds || !pageHasInspectableImage(page)) {
        setShowZoomHint(false);
        document.body.style.cursor = "default";
        return;
      }
      const foldProgress = useBookStore.getState().foldProgress;
      if (!inspectPickAllowed(pickKind, foldProgress)) {
        setShowZoomHint(false);
        document.body.style.cursor = "default";
        return;
      }
      const ok = !!(e.uv && uvInImageBounds(e.uv, bounds));
      setShowZoomHint(ok);
      document.body.style.cursor = ok ? "zoom-in" : "default";
    },
    [bounds, page, pickKind, modalOpen],
  );

  const onPointerOut = useCallback(() => {
    setShowZoomHint(false);
    document.body.style.cursor = "default";
  }, []);

  const hintPosition = useMemo((): [number, number, number] => {
    if (!bounds) return [0, 0, 0.02];
    const u = (bounds.uMin + bounds.uMax) / 2;
    const v = (bounds.vMin + bounds.vMax) / 2;
    const x = (u - 0.5) * pageWidth;
    const y = (v - 0.5) * bookHeight;
    return [x, y, 0.025];
  }, [bounds, pageWidth, bookHeight]);

  return {
    bounds,
    showZoomHint,
    hintPosition,
    onPointerMove,
    onPointerOut,
  };
}
