import { useMemo } from 'react';
import * as THREE from 'three';

export function BookShadow() {
  const geometry = useMemo(() => new THREE.PlaneGeometry(7, 4.5), []);

  const material = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.12)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.06)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;

    return new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });
  }, []);

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[0.15, -0.35, -0.2]}
    />
  );
}
