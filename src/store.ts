import { create } from 'zustand';
import { numSpreads } from './content/pages';

interface BookStore {
  progress: number;
  spreadIndex: number;
  foldProgress: number;
  isAnimating: boolean;
  isBooted: boolean;
  bootProgress: number;

  setProgress: (p: number) => void;
  setAnimating: (v: boolean) => void;
  setBooted: (v: boolean) => void;
  setBootProgress: (v: number) => void;
}

export const useBookStore = create<BookStore>((set) => ({
  progress: 0,
  spreadIndex: 0,
  foldProgress: 0,
  isAnimating: false,
  isBooted: false,
  bootProgress: 0,

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
}));
