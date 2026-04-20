import { useBookStore } from '../../store';
import './LoadingScreen.css';

const FLAVOR_TEXT = [
  'Binding the pages\u2026',
  'Inking the illustrations\u2026',
  'Warming the light\u2026',
  'Opening the cover\u2026',
];

function getFlavorText(progress: number): string {
  if (progress < 0.3) return FLAVOR_TEXT[0];
  if (progress < 0.7) return FLAVOR_TEXT[1];
  if (progress < 0.95) return FLAVOR_TEXT[2];
  return FLAVOR_TEXT[3];
}

export function LoadingScreen() {
  const isBooted = useBookStore((s) => s.isBooted);
  const bootProgress = useBookStore((s) => s.bootProgress);

  return (
    <div
      className={`loading-screen ${isBooted ? 'fade-out' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="loading-content">
        {/* SVG Book silhouette with page flutter */}
        <div className="loading-book-icon">
          <svg viewBox="0 0 80 100" className="book-silhouette">
            <rect x="5" y="5" width="70" height="90" rx="3" fill="#FDFBF7" stroke="#c5bfb3" strokeWidth="1.5" />
            <rect x="5" y="5" width="70" height="90" rx="3" fill="none" stroke="#2b303a" strokeWidth="0.5" opacity="0.3" />
            <line x1="40" y1="8" x2="40" y2="92" stroke="#d4cfc5" strokeWidth="1" />
          </svg>
          <div className="flutter-page" />
        </div>

        <div className="loading-brand">HEADING TEXT</div>

        <div className="loading-progress-track">
          <div
            className="loading-progress-fill"
            style={{ width: `${bootProgress * 100}%` }}
            role="progressbar"
            aria-valuenow={Math.round(bootProgress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        <div className="loading-flavor">{getFlavorText(bootProgress)}</div>
      </div>
    </div>
  );
}
