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
        <p className="hero-eyebrow">Interactive Experience</p>
        <h1 className="hero-title">
          Discover the Art
          <br />
          of <em>Digital Craft</em>
        </h1>
        <p className="hero-description">
          An immersive journey through design, typography, and visual storytelling.
          Turn each page to explore ideas that shape the digital world.
        </p>
        <div className="hero-actions">
          <button className="hero-cta" onClick={handleStart}>
            Open the Book
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="hero-arrow">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="hero-hint">or scroll to begin</span>
        </div>
        <div className="hero-meta">
          <span className="hero-meta-item">10 Pages</span>
          <span className="hero-meta-dot" />
          <span className="hero-meta-item">5 min read</span>
          <span className="hero-meta-dot" />
          <span className="hero-meta-item">Interactive</span>
        </div>
      </div>
    </div>
  );
}
