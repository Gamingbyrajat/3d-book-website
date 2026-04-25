import { useMemo } from 'react';
import * as THREE from 'three';
import { useBookStore } from '../../store';
import { numSpreads } from '../../content/pages';

interface BookEdgeProps {
  bookWidth: number;
  bookHeight: number;
  pageCount: number;
}

const COVER_COLOR = '#1e2128';

export function BookEdge({ bookWidth, bookHeight }: BookEdgeProps) {
  const spreadIndex = useBookStore((s) => s.spreadIndex);
  const pageWidth = bookWidth / 2;
  const thickness = 0.08;

  const isSecondToLast = spreadIndex >= numSpreads - 2;

  const backCoverGeo = useMemo(
    () => new THREE.PlaneGeometry(pageWidth, bookHeight),
    [pageWidth, bookHeight]
  );
  const backCoverMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: COVER_COLOR, side: THREE.FrontSide }),
    []
  );

  // Don't show any back cover near the end — prevents dark bleed-through
  if (isSecondToLast) {
    return null;
  }

  // For inner spreads only, show back surface behind the right page for depth
  return (
    <group>
      <mesh
        geometry={backCoverGeo}
        material={backCoverMat}
        position={[pageWidth / 2, 0, -thickness]}
      />
    </group>
  );
}
