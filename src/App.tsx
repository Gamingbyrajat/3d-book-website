import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BookCanvas } from './components/Book/BookCanvas';
import { BookOverlay } from './components/Overlay/BookOverlay';
import { Navbar } from './components/Navbar/Navbar';
import { LoadingScreen } from './components/LoadingScreen/LoadingScreen';
import { HeroSection } from './components/HeroSection/HeroSection';
import { ContactForm } from './components/ContactForm/ContactForm';
import { useProgressSync } from './hooks/useProgressSync';
import { useBootSequence } from './hooks/useBootSequence';
import { useBookStore } from './store';
import { numSpreads } from './content/pages';

function BookApp() {
  useProgressSync();
  const isBooted = useBookStore((s) => s.isBooted);

  return (
    <>
      {/* Scroll height spacer */}
      <div
        className="scroll-spacer"
        style={{ height: `${numSpreads * 100}vh` }}
      />

      {/* 3D book */}
      {isBooted && <BookCanvas />}

      {/* Screen-reader overlay */}
      {isBooted && <BookOverlay />}

      {/* Navigation */}
      {isBooted && <Navbar />}

      {/* Hero section — left side on cover */}
      {isBooted && <HeroSection />}

      {/* Contact form — right side on last spread */}
      {isBooted && <ContactForm />}
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
