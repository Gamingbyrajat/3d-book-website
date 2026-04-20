import { useEffect, useRef } from 'react';
import { useBookStore } from '../store';
import { preRenderAllTextures } from './usePageTexture';

const MIN_DISPLAY_MS = 1800;

export function useBootSequence() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const startTime = performance.now();
    const store = useBookStore.getState();

    async function boot() {
      window.scrollTo(0, 0);
      store.setProgress(0);
      store.setBootProgress(0.1);

      // Pre-render ALL page textures (loads images, fonts, renders canvases)
      store.setBootProgress(0.3);
      await preRenderAllTextures();
      store.setBootProgress(0.9);

      store.setBootProgress(1.0);

      const elapsed = performance.now() - startTime;
      const remaining = MIN_DISPLAY_MS - elapsed;
      if (remaining > 0) {
        await new Promise((r) => setTimeout(r, remaining));
      }

      store.setBooted(true);
    }

    boot();
  }, []);
}
