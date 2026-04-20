import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBookStore } from '../store';
import { initAudio, updatePaperRustle, resumeAudio } from '../audio/paperRustle';

export function useAudio() {
  const lastProgress = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    const handleGesture = () => {
      initAudio();
      resumeAudio();
    };

    window.addEventListener('click', handleGesture, { once: true });
    window.addEventListener('touchstart', handleGesture, { once: true });
    window.addEventListener('wheel', resumeAudio);

    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('wheel', resumeAudio);
    };
  }, []);

  useFrame(() => {
    const progress = useBookStore.getState().progress;
    const now = performance.now();
    const dt = now - lastTime.current || 1;
    const velocity = Math.abs(progress - lastProgress.current) / dt;

    updatePaperRustle(velocity);

    lastProgress.current = progress;
    lastTime.current = now;
  });
}
