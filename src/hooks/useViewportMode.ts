import { useEffect, useState } from 'react';

export const MOBILE_PORTRAIT_QUERY = '(max-width: 768px) and (orientation: portrait)';

export function isMobilePortraitViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_PORTRAIT_QUERY).matches;
}

export function useViewportMode() {
  const [isMobilePortrait, setIsMobilePortrait] = useState(isMobilePortraitViewport);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_PORTRAIT_QUERY);
    const update = () => setIsMobilePortrait(media.matches);

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return { isMobilePortrait };
}
