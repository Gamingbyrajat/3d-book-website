import { useBookStore } from '../../store';
import { lenis } from '../../lenis';
import './HeroSection.css';

export function HeroSection() {
  const progress = useBookStore((s) => s.progress);

  const opacity = Math.max(0, 1 - progress * 2.5);
  const translateY = progress * 40;

  if (opacity <= 0) return null;

  const handleStart = () => {
    lenis.scrollTo(window.innerHeight, {
      duration: 1.2,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
    });
  };

  return (
    <div
      className="hero-section"
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        pointerEvents: opacity > 0.3 ? 'auto' : 'none',
      }}
    >
      <div className="hero-content">
        <p className="hero-eyebrow">Git Repository Management</p>
        <h1 className="hero-title">
          Park Your Repos.
          <br />
          <em>Free Up Your Disk.</em>
        </h1>
        <p className="hero-description">
          The CLI tool that archives your git repositories securely to a private vault.
          Restore them instantly when you need them back.
        </p>
        <div className="hero-actions">
          <button className="hero-cta" onClick={handleStart}>
            Start Reading
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="hero-arrow">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="hero-hint">or scroll to begin</span>
        </div>
        <div className="hero-meta">
          <span className="hero-meta-item">macOS & Linux</span>
          <span className="hero-meta-dot" />
          <span className="hero-meta-item">Node.js v18+</span>
          <span className="hero-meta-dot" />
          <span className="hero-meta-item">AES-256-GCM</span>
        </div>
      </div>
    </div>
  );
}
