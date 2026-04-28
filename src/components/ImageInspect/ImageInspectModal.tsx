import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useBookStore } from "../../store";
import { setLenisImageInspectScrollLock } from "../../lenis";
import "./ImageInspectModal.css";

function defaultCenterRect(): DOMRect {
  const w = Math.min(window.innerWidth * 0.5, 480);
  const h = w * 0.62;
  return new DOMRect(
    (window.innerWidth - w) / 2,
    (window.innerHeight - h) / 2,
    w,
    h,
  );
}

export function ImageInspectModal() {
  const open = useBookStore((s) => s.imageInspect.open);
  const src = useBookStore((s) => s.imageInspect.src);
  const alt = useBookStore((s) => s.imageInspect.alt);
  const fromRect = useBookStore((s) => s.imageInspect.fromRect);
  const closeImageInspect = useBookStore((s) => s.closeImageInspect);

  const backdropRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef(false);

  const [exiting, setExiting] = useState(false);
  const lastFocus = useRef<HTMLElement | null>(null);

  const runEnterFlip = useCallback(() => {
    if (closingRef.current) return;
    const frame = frameRef.current;
    if (!frame) return;

    const first = fromRect
      ? new DOMRect(fromRect.left, fromRect.top, fromRect.width, fromRect.height)
      : defaultCenterRect();

    frame.style.transition = "none";
    frame.style.opacity = "0.001";
    frame.style.transform = "translate(0,0) scale(1)";

    const last = frame.getBoundingClientRect();
    const dx = first.left + first.width / 2 - (last.left + last.width / 2);
    const dy = first.top + first.height / 2 - (last.top + last.height / 2);
    const sx = first.width / Math.max(last.width, 1);
    const sy = first.height / Math.max(last.height, 1);
    frame.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    frame.style.opacity = "0.55";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        frame.style.transition =
          "transform 440ms cubic-bezier(0.2, 0.9, 0.2, 1), opacity 400ms cubic-bezier(0.22, 1, 0.36, 1)";
        frame.style.transform = "translate(0, 0) scale(1, 1)";
        frame.style.opacity = "1";
      });
    });
  }, [fromRect]);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setExiting(true);

    const frame = frameRef.current;
    const first = fromRect
      ? new DOMRect(fromRect.left, fromRect.top, fromRect.width, fromRect.height)
      : defaultCenterRect();

    if (frame) {
      const last = frame.getBoundingClientRect();
      const dx = first.left + first.width / 2 - (last.left + last.width / 2);
      const dy = first.top + first.height / 2 - (last.top + last.height / 2);
      const sx = first.width / Math.max(last.width, 1);
      const sy = first.height / Math.max(last.height, 1);
      frame.style.transition = "none";
      frame.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      frame.style.opacity = "0.5";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          frame.style.transition =
            "transform 340ms cubic-bezier(0.33, 1, 0.32, 1), opacity 280ms ease";
          frame.style.transform = "translate(0, 0) scale(1, 1)";
          frame.style.opacity = "0";
        });
      });
    }

    window.setTimeout(() => {
      closeImageInspect();
      setExiting(false);
      closingRef.current = false;
    }, 360);
  }, [closeImageInspect, fromRect]);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement;
    const t = window.setTimeout(() => closeRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open, src]);

  useLayoutEffect(() => {
    if (!open || exiting || !src) return;
    const img = imgRef.current;
    if (!img) return;

    const schedule = () =>
      requestAnimationFrame(() => requestAnimationFrame(runEnterFlip));

    if (img.complete && img.naturalWidth > 0) {
      schedule();
    } else {
      img.addEventListener("load", schedule, { once: true });
      img.addEventListener("error", schedule, { once: true });
    }
  }, [open, exiting, src, runEnterFlip]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, requestClose]);

  useEffect(() => {
    if (!open) return;
    setLenisImageInspectScrollLock(true);
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
    };
    document.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => {
      setLenisImageInspectScrollLock(false);
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      document.removeEventListener("wheel", onWheel, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const root = backdropRef.current;
    if (!root) return;
    const focusable =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const onTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = root.querySelectorAll<HTMLElement>(focusable);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onTrap);
    return () => window.removeEventListener("keydown", onTrap);
  }, [open]);

  useEffect(() => {
    if (open) return;
    if (lastFocus.current?.focus) {
      lastFocus.current.focus();
      lastFocus.current = null;
    }
  }, [open]);

  if (!open && !exiting) return null;

  return (
    <div
      ref={backdropRef}
      className={`image-inspect-backdrop ${exiting ? "image-inspect-backdrop--exit" : ""}`}
      role="presentation"
      onClick={(e) => {
        if (e.target === backdropRef.current) requestClose();
      }}
    >
      <div
        className="image-inspect-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={alt || "Expanded illustration"}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          className="image-inspect-close"
          aria-label="Close expanded image"
          onClick={requestClose}
        >
          ×
        </button>
        <div ref={frameRef} className="image-inspect-frame">
          {src ? (
            <img
              ref={imgRef}
              key={src}
              className="image-inspect-img"
              src={src}
              alt={alt}
              decoding="async"
              draggable={false}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
