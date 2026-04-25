import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { usePageTexture } from '../../hooks/usePageTexture';
import type { Page as PageType } from '../../content/pages';

interface PageProps {
  side: 'left' | 'right';
  bookWidth: number;
  bookHeight: number;
  page?: PageType;
  visible?: boolean;
}

const COVER_EDGE_COLOR = '#1e2128';
const COVER_THICKNESS = 0.025;

export function Page({ side, bookWidth, bookHeight, page, visible = true }: PageProps) {
  const pageWidth = bookWidth / 2;
  const texture = usePageTexture(page);
  const isCover = page?.isCover;

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(pageWidth, bookHeight, 1, 1),
    [pageWidth, bookHeight],
  );

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.92,
      metalness: 0.02,
      envMapIntensity: 0.85,
      side: THREE.FrontSide,
    });
    mat.map = texture ?? null;
    if (isCover) {
      mat.emissive = new THREE.Color('#1a1510');
      mat.emissiveIntensity = 0.05;
    }
    mat.needsUpdate = true;
    return mat;
  }, [texture, isCover]);

  const edgeBottomGeo = useMemo(
    () => new THREE.PlaneGeometry(pageWidth, COVER_THICKNESS),
    [pageWidth],
  );
  const edgeSideGeo = useMemo(
    () => new THREE.PlaneGeometry(COVER_THICKNESS, bookHeight),
    [bookHeight],
  );
  const edgeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COVER_EDGE_COLOR,
        roughness: 0.88,
        metalness: 0.05,
        side: THREE.DoubleSide,
      }),
    [],
  );

  useEffect(() => {
    return () => {
      material.dispose();
      edgeMat.dispose();
      geometry.dispose();
      edgeBottomGeo.dispose();
      edgeSideGeo.dispose();
    };
  }, [material, edgeMat, geometry, edgeBottomGeo, edgeSideGeo]);

  if (!visible) return null;

  const xOffset = side === 'left' ? -pageWidth / 2 : pageWidth / 2;

  return (
    <group>
      <mesh
        geometry={geometry}
        material={material}
        position={[xOffset, 0, isCover ? 0.003 : 0]}
        castShadow
        receiveShadow
      />

      {isCover && (
        <>
          <mesh
            geometry={edgeBottomGeo}
            material={edgeMat}
            position={[xOffset, -bookHeight / 2, 0.0015]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <mesh
            geometry={edgeBottomGeo}
            material={edgeMat}
            position={[xOffset, bookHeight / 2, 0.0015]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
          <mesh
            geometry={edgeSideGeo}
            material={edgeMat}
            position={[
              side === 'right' ? xOffset + pageWidth / 2 : xOffset - pageWidth / 2,
              0,
              0.0015,
            ]}
            rotation={[0, Math.PI / 2, 0]}
          />
        </>
      )}
    </group>
  );
}
