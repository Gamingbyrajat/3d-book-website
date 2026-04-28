import { useEffect, useRef } from 'react';
import { useBookStore } from '../store';
import { preRenderAllTextures } from './usePageTexture';

const MIN_DISPLAY_MS = 1800;
const WARMUP_TIMEOUT_MS = 8000;

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
      store.setShaderWarmed(false);
      store.setGpuWarmupStarted(false);
      store.setBootProgress(0.1);

      store.setBootProgress(0.3);
      await preRenderAllTextures();
      store.setBootProgress(0.72);

      store.setGpuWarmupStarted(true);

      const warmupStart = performance.now();
      await new Promise<void>((resolve) => {
        if (useBookStore.getState().shaderWarmed) {
          resolve();
          return;
        }

        let settled = false;
        const handles: {
          interval: ReturnType<typeof setInterval>;
          unsub: () => void;
        } = {
          interval: 0 as unknown as ReturnType<typeof setInterval>,
          unsub: () => {},
        };

        function finish() {
          if (settled) return;
          settled = true;
          window.clearInterval(handles.interval);
          handles.unsub();
          resolve();
        }

        handles.interval = window.setInterval(() => {
          if (performance.now() - warmupStart > WARMUP_TIMEOUT_MS) {
            if (!useBookStore.getState().shaderWarmed) {
              useBookStore.getState().setShaderWarmed(true);
            }
            finish();
          }
        }, 200);

        handles.unsub = useBookStore.subscribe((s) => {
          if (s.shaderWarmed) finish();
        });

        if (useBookStore.getState().shaderWarmed) finish();
      });

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
