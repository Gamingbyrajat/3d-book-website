import { useBookStore } from "../../store";
import "./LoadingScreen.css";

const FLAVOR_TEXT = [
  "Initializing vault...",
  "Encrypting connections...",
  "Preparing commands...",
  "Ready to park.",
];

/** Decorative only; real commands mirror repo-parking CLI. */
const TICKER_COMMANDS = [
  "parking init",
  "parking park my-app",
  "parking list",
  "parking status A",
  "parking unpark my-app",
  "parking change-password",
  "parking recover",
  "parking forget my-app",
];

function getFlavorText(progress: number): string {
  if (progress < 0.3) return FLAVOR_TEXT[0];
  if (progress < 0.7) return FLAVOR_TEXT[1];
  if (progress < 0.95) return FLAVOR_TEXT[2];
  return FLAVOR_TEXT[3];
}

function getPhase(progress: number): "phase-1" | "phase-2" | "phase-3" | "phase-4" {
  if (progress < 0.3) return "phase-1";
  if (progress < 0.7) return "phase-2";
  if (progress < 0.95) return "phase-3";
  return "phase-4";
}

export function LoadingScreen() {
  const isBooted = useBookStore((s) => s.isBooted);
  const bootProgress = useBookStore((s) => s.bootProgress);

  return (
    <div className={`loading-screen ${isBooted ? "fade-out" : ""}`}>
      <div className={`loading-content ${getPhase(bootProgress)}`}>
        <div className="loading-book-stack" aria-hidden="true">
          <div className="loading-fold-sheet loading-fold-sheet--back" />
          <div className="loading-fold-sheet loading-fold-sheet--4" />
          <div className="loading-fold-sheet loading-fold-sheet--3" />
          <div className="loading-fold-sheet loading-fold-sheet--2" />
          <div className="loading-fold-sheet loading-fold-sheet--1" />
        </div>

        <div className="loading-brand-wrap">
          <div className="loading-brand-kicker">Interactive Edition</div>
          <div className="loading-brand">Repo Parking Package</div>
        </div>

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

        <p className="loading-flavor" key={getFlavorText(bootProgress)}>
          {getFlavorText(bootProgress)}
        </p>

        <div className="loading-terminal" aria-hidden="true">
          <div className="loading-terminal-track">
            <div className="loading-terminal-segment">
              {TICKER_COMMANDS.map((cmd) => (
                <span key={cmd} className="loading-terminal-cmd">
                  {cmd}
                </span>
              ))}
            </div>
            <div className="loading-terminal-segment" aria-hidden="true">
              {TICKER_COMMANDS.map((cmd) => (
                <span key={`${cmd}-dup`} className="loading-terminal-cmd">
                  {cmd}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <span className="loading-sr-only" role="status" aria-live="polite" aria-atomic="true">
        Loading interactive book experience.
      </span>
    </div>
  );
}
