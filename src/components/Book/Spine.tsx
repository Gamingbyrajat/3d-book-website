import { useMemo } from 'react';
import * as THREE from 'three';

interface SpineProps {
  bookHeight: number;
  thickness: number;
}

export function Spine({ bookHeight, thickness }: SpineProps) {
  const geometry = useMemo(
    () => new THREE.PlaneGeometry(thickness, bookHeight, 1, 1),
    [thickness, bookHeight]
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d4cfc5',
        roughness: 0.8,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
    []
  );

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[0, 0, 0.002]}
    />
  );
}
