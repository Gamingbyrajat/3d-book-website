import { create } from 'zustand';
import { numSpreads } from './content/pages';

const STORAGE_KEY = 'repo-parking-book-progress';

interface BookStore {
  progress: number;
  spreadIndex: number;
  foldProgress: number;
  isAnimating: boolean;
  isBooted: boolean;
  bootProgress: number;
  /** Mount hidden Canvas for GPU shader compile before revealing the book. */
  gpuWarmupStarted: boolean;
  shaderWarmed: boolean;
  prefersReducedMotion: boolean;

  setProgress: (p: number) => void;
  setAnimating: (v: boolean) => void;
  setBooted: (v: boolean) => void;
  setBootProgress: (v: number) => void;
  setGpuWarmupStarted: (v: boolean) => void;
  setShaderWarmed: (v: boolean) => void;
  setPrefersReducedMotion: (v: boolean) => void;
}

export const useBookStore = create<BookStore>((set) => ({
  progress: 0,
  spreadIndex: 0,
  foldProgress: 0,
  isAnimating: false,
  isBooted: false,
  bootProgress: 0,
  gpuWarmupStarted: false,
  shaderWarmed: false,
  prefersReducedMotion: false,

  setProgress: (p: number) => {
    const clamped = Math.max(0, Math.min(p, numSpreads - 1));
    const spreadIndex = Math.floor(clamped);
    const maxSpread = numSpreads - 1;
    const foldProgress = spreadIndex >= maxSpread ? 0 : clamped - spreadIndex;

    set({ progress: clamped, spreadIndex, foldProgress });
  },

  setAnimating: (v) => set({ isAnimating: v }),
  setBooted: (v) => set({ isBooted: v }),
  setBootProgress: (v) => set({ bootProgress: v }),
  setGpuWarmupStarted: (v) => set({ gpuWarmupStarted: v }),
  setShaderWarmed: (v) => set({ shaderWarmed: v }),
  setPrefersReducedMotion: (v) => set({ prefersReducedMotion: v }),
}));

export function readSavedBookProgress(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    return n;
  } catch {
    return null;
  }
}

export function persistBookProgress(progress: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(progress));
  } catch {
    /* ignore quota / private mode */
  }
}
