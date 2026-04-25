import * as THREE from "three";
import type { ImageUvBounds } from "./pageImageBounds";

/**
 * Projects UV rectangle on a mesh plane to viewport CSS pixels (for FLIP).
 * Mesh local plane: centered origin, extent pageWidth × bookHeight in XY.
 */
export function screenRectForUvBounds(
  camera: THREE.Camera,
  mesh: THREE.Object3D,
  pageWidth: number,
  bookHeight: number,
  b: ImageUvBounds,
  viewport: { width: number; height: number },
): { left: number; top: number; width: number; height: number } {
  const nx = (u: number) => (u - 0.5) * pageWidth;
  const ny = (v: number) => (v - 0.5) * bookHeight;
  const corners = [
    new THREE.Vector3(nx(b.uMin), ny(b.vMin), 0),
    new THREE.Vector3(nx(b.uMax), ny(b.vMin), 0),
    new THREE.Vector3(nx(b.uMax), ny(b.vMax), 0),
    new THREE.Vector3(nx(b.uMin), ny(b.vMax), 0),
  ];
  const v = new THREE.Vector3();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of corners) {
    v.copy(c).applyMatrix4(mesh.matrixWorld);
    v.project(camera);
    const sx = (v.x * 0.5 + 0.5) * viewport.width;
    const sy = (-v.y * 0.5 + 0.5) * viewport.height;
    minX = Math.min(minX, sx);
    maxX = Math.max(maxX, sx);
    minY = Math.min(minY, sy);
    maxY = Math.max(maxY, sy);
  }
  return {
    left: minX,
    top: minY,
    width: Math.max(8, maxX - minX),
    height: Math.max(8, maxY - minY),
  };
}
