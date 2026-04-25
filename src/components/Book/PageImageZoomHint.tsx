import { useBookStore } from "../../store";
import "../ImageInspect/ImageInspectModal.css";

type Props = {
  /** Hovering image UV region (parent already validated bounds). */
  active: boolean;
};

/** Single magnifier affordance; hidden while modal open or when not active. */
export function PageImageZoomHint({ active }: Props) {
  const modalOpen = useBookStore((s) => s.imageInspect.open);
  const visible = active && !modalOpen;

  return (
    <div
      className={`page-image-zoom-hint ${visible ? "page-image-zoom-hint--visible" : ""}`}
      aria-hidden="true"
    >
      <svg
        className="page-image-zoom-hint__icon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="6" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
    </div>
  );
}
