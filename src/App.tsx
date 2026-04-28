import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BookCanvas } from './components/Book/BookCanvas';
import { BookOverlay } from './components/Overlay/BookOverlay';
import { Navbar } from './components/Navbar/Navbar';
import { LoadingScreen } from './components/LoadingScreen/LoadingScreen';
import { HeroSection } from './components/HeroSection/HeroSection';
import { ContactForm } from './components/ContactForm/ContactForm';
import { BookProgressIndicator, SpreadNavTapZones } from './components/BookChrome/BookChrome';
import { ImageInspectModal } from './components/ImageInspect/ImageInspectModal';
import { useProgressSync } from './hooks/useProgressSync';
import { useBootSequence } from './hooks/useBootSequence';
import { useBookStore } from './store';
import { numSpreads } from './content/pages';
import { setLenisSmoothWheel } from './lenis';

function BookApp() {
  useProgressSync();
  const isBooted = useBookStore((s) => s.isBooted);
  const gpuWarmupStarted = useBookStore((s) => s.gpuWarmupStarted);
  const imageInspectOpen = useBookStore((s) => s.imageInspect.open);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      const v = mq.matches;
      useBookStore.getState().setPrefersReducedMotion(v);
      setLenisSmoothWheel(!v);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <>
      {/* Scroll height spacer */}
      <div
        className={`scroll-spacer${imageInspectOpen ? ' scroll-spacer--inspect-lock' : ''}`}
        style={{ height: `${numSpreads * 100}vh` }}
      />

      {gpuWarmupStarted && (
        <div
          className={isBooted ? 'book-canvas-host book-canvas-host--live' : 'book-canvas-host book-canvas-host--warmup'}
        >
          <BookCanvas />
        </div>
      )}

      {isBooted && <BookOverlay />}

      {isBooted && <BookProgressIndicator />}

      {isBooted && <SpreadNavTapZones />}

      {isBooted && <Navbar />}

      {isBooted && <HeroSection />}

      {isBooted && <ContactForm />}

      {isBooted && <ImageInspectModal />}
    </>
  );
}

export default function App() {
  useBootSequence();

  return (
    <BrowserRouter>
      <LoadingScreen />
      <Routes>
        <Route path="*" element={<BookApp />} />
      </Routes>
    </BrowserRouter>
  );
}
